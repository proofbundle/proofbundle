//! ECDSA-P384 Implementation
//! 
//! Per FIPS 186-5 on NIST P-384 curve. RFC 6979 deterministic nonces.
//! Low-s normalization enforced (if s > n/2, replace with n-s).
//! Fixed-width signatures: 96 bytes (r: 48 BE, s: 48 BE), no DER.

use p384::elliptic_curve::ops::Reduce;
use p384::{NistP384, Scalar, U384};
use ecdsa::{Signature as EcdsaSignature, SigningKey, VerifyingKey, signature::Signer, signature::Verifier};
use rand::{CryptoRng, RngCore};
use crate::{CryptoError, Result};

/// P-384 curve order (n) for low-s normalization
/// n = FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973
const P384_N: [u8; 48] = [
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xC7, 0x63, 0x4D, 0x81, 0xF4, 0x37, 0x2D, 0xDF,
    0x58, 0x1A, 0x0D, 0xB2, 0x48, 0xB0, 0xA7, 0x7A,
    0xEC, 0xEC, 0x19, 0x6A, 0xCC, 0xC5, 0x29, 0x73,
];

/// P-384 n/2 for low-s check
fn p384_n_half() -> [u8; 48] {
    let mut half = P384_N;
    let mut carry = 0u16;
    for i in (0..48).rev() {
        let val = (half[i] as u16) + carry;
        half[i] = (val >> 1) as u8;
        carry = (val & 1) << 8;
    }
    half
}

/// ECDSA-P384 private key (48 bytes)
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EcdsaPrivateKey(pub [u8; 48]);

/// ECDSA-P384 public key (49 bytes compressed: 0x02/0x03 prefix + 48-byte x-coordinate)
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EcdsaPublicKey(pub [u8; 49]);

/// Apply low-s normalization to signature component
/// If s > n/2, returns n - s; otherwise returns s
fn normalize_s(s: &[u8; 48]) -> [u8; 48] {
    let n_half = p384_n_half();
    
    // Compare s with n/2 (big-endian comparison)
    let mut s_is_greater = false;
    for i in 0..48 {
        if s[i] > n_half[i] {
            s_is_greater = true;
            break;
        } else if s[i] < n_half[i] {
            break;
        }
    }
    
    if !s_is_greater {
        return *s;
    }
    
    // Compute n - s
    let mut result = [0u8; 48];
    let mut borrow = 0i16;
    for i in (0..48).rev() {
        let val = (P384_N[i] as i16) - (s[i] as i16) - borrow;
        if val < 0 {
            result[i] = (val + 256) as u8;
            borrow = 1;
        } else {
            result[i] = val as u8;
            borrow = 0;
        }
    }
    
    result
}

/// Sign message with ECDSA-P384 using RFC 6979 deterministic nonce
/// 
/// # Arguments
/// * `private_key` - 48-byte private key
/// * `message` - Message to sign
/// 
/// # Returns
/// 96-byte signature (r: 48 BE, s: 48 BE, low-s normalized)
pub fn sign_ecdsa(private_key: &[u8; 48], message: &[u8]) -> Result<[u8; 96]> {
    // Create signing key from bytes
    let signing_key = SigningKey::<NistP384>::from_bytes(
        &p384::FieldBytes::from_slice(private_key)
    ).map_err(|_| CryptoError::InvalidKeyLength { expected: 48, actual: private_key.len() })?;
    
    // Sign (uses RFC 6979 deterministic nonce internally)
    let signature: EcdsaSignature<NistP384> = signing_key.sign(message);
    
    // Extract r and s
    let sig_bytes = signature.to_bytes();
    let (r, s) = sig_bytes.split_at(48);
    
    // Apply low-s normalization
    let s_normalized = normalize_s(s.try_into().unwrap());
    
    // Construct fixed-width signature
    let mut result = [0u8; 96];
    result[..48].copy_from_slice(r);
    result[48..].copy_from_slice(&s_normalized);
    
    Ok(result)
}

/// Verify ECDSA-P384 signature
/// 
/// # Arguments
/// * `public_key` - 49-byte compressed public key
/// * `message` - Message that was signed
/// * `signature` - 96-byte signature (r: 48 BE, s: 48 BE)
/// 
/// # Returns
/// true if valid, false otherwise
pub fn verify_ecdsa(public_key: &[u8; 49], message: &[u8], signature: &[u8; 96]) -> Result<bool> {
    // Parse verifying key from compressed public key
    let verifying_key = VerifyingKey::<NistP384>::from_sec1_bytes(public_key)
        .map_err(|_| CryptoError::InvalidKeyLength { expected: 49, actual: public_key.len() })?;
    
    // Reconstruct signature from fixed-width components
    let mut sig_bytes = [0u8; 96];
    sig_bytes.copy_from_slice(signature);
    
    // Check low-s normalization (s must be <= n/2)
    let s = &sig_bytes[48..];
    let n_half = p384_n_half();
    let mut s_is_valid = true;
    for i in 0..48 {
        if s[i] > n_half[i] {
            s_is_valid = false;
            break;
        } else if s[i] < n_half[i] {
            break;
        }
    }
    
    if !s_is_valid {
        return Err(CryptoError::NonCanonicalSignature);
    }
    
    // Parse signature
    let ecdsa_sig = EcdsaSignature::<NistP384>::from_slice(&sig_bytes)
        .map_err(|_| CryptoError::InvalidSignatureLength { expected: 96, actual: signature.len() })?;
    
    // Verify
    match verifying_key.verify(message, &ecdsa_sig) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Generate new ECDSA-P384 keypair
/// 
/// # Arguments
/// * `rng` - Cryptographically secure RNG
/// 
/// # Returns
/// (private_key, public_key) tuple
pub fn generate_ecdsa_keypair<R: CryptoRng + RngCore>(rng: &mut R) -> Result<(EcdsaPrivateKey, EcdsaPublicKey)> {
    let signing_key = SigningKey::<NistP384>::random(rng);
    
    let private_bytes: [u8; 48] = signing_key.to_bytes().into();
    let public_bytes: [u8; 49] = signing_key.verifying_key().to_sec1_bytes().into();
    
    Ok((EcdsaPrivateKey(private_bytes), EcdsaPublicKey(public_bytes)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::thread_rng;

    #[test]
    fn test_keypair_generation() {
        let mut rng = thread_rng();
        let (priv_key, pub_key) = generate_ecdsa_keypair(&mut rng).unwrap();
        
        assert_eq!(priv_key.0.len(), 48);
        assert_eq!(pub_key.0.len(), 49);
        assert!(pub_key.0[0] == 0x02 || pub_key.0[0] == 0x03);
    }

    #[test]
    fn test_sign_verify_roundtrip() {
        let mut rng = thread_rng();
        let (priv_key, pub_key) = generate_ecdsa_keypair(&mut rng).unwrap();
        
        let message = b"test message for ECDSA-P384";
        let signature = sign_ecdsa(&priv_key.0, message).unwrap();
        
        assert_eq!(signature.len(), 96);
        
        let valid = verify_ecdsa(&pub_key.0, message, &signature).unwrap();
        assert!(valid);
    }

    #[test]
    fn test_verify_wrong_message() {
        let mut rng = thread_rng();
        let (priv_key, pub_key) = generate_ecdsa_keypair(&mut rng).unwrap();
        
        let message = b"original message";
        let signature = sign_ecdsa(&priv_key.0, message).unwrap();
        
        let wrong_message = b"different message";
        let valid = verify_ecdsa(&pub_key.0, wrong_message, &signature).unwrap();
        assert!(!valid);
    }

    #[test]
    fn test_low_s_normalization() {
        // Test that signatures are low-s normalized
        let mut rng = thread_rng();
        let (priv_key, pub_key) = generate_ecdsa_keypair(&mut rng).unwrap();
        
        let message = b"test";
        let signature = sign_ecdsa(&priv_key.0, message).unwrap();
        
        // Verify s component is <= n/2
        let s = &signature[48..];
        let n_half = p384_n_half();
        
        let mut s_is_low = false;
        for i in 0..48 {
            if s[i] < n_half[i] {
                s_is_low = true;
                break;
            } else if s[i] > n_half[i] {
                break;
            }
        }
        
        assert!(s_is_low, "s component must be low-s normalized");
    }
}
