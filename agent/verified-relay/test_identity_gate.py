"""Adversarial integration checks; no private material leaves the local key store."""
import copy
import unittest
import os
import json
import hashlib
from pathlib import Path
import identity_gate as gate
os.environ.setdefault('PB_AGENT_ROOT', str(Path.home()/'pb/work/bridge-reestablish-20261011/test-identities'))

class IdentityGateChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sender='proofbundle-relay-test-sender'
        cls.recipient='proofbundle-relay-test-recipient'
        cls.verifier='proofbundle-relay-test-verifier'
        for name in (cls.sender,cls.recipient,cls.verifier):gate.register(name)
    def envelope(self,profile=None):
        return gate.seal_request(self.sender,self.recipient,{'subject':'test','body':'exact payload','notify':False},self.verifier,profile)
    def test_encrypted_roundtrips(self):
        for profile in (None,'ml-kem-768-hkdf-sha256-chacha20poly1305-v1'):
            env=self.envelope(profile);accepted=gate.verify_request(env,self.verifier)
            self.assertNotIn('payload',accepted)
            self.assertEqual(gate.open_delivery(accepted['recipient_envelope'],self.recipient,self.verifier)['payload']['body'],'exact payload')
            self.assertTrue(gate.verify_receipt(accepted['receipt'],accepted['recipient_envelope'],self.verifier)['verified'])
    def test_tampering(self):
        for profile in (None,'ml-kem-768-hkdf-sha256-chacha20poly1305-v1'):
            for field in ('ciphertext','nonce','encapsulated_key','kx_salt'):
                env=self.envelope(profile);v=env['payload'][field];env['payload'][field]=('0' if v[0]!='0' else '1')+v[1:]
                with self.assertRaises(ValueError):gate.verify_request(env,self.verifier)
    def test_identity_and_destination(self):
        env=self.envelope();forged=copy.deepcopy(env);forged['from']['agent_id']=self.recipient
        with self.assertRaises(ValueError):gate.verify_request(forged,self.verifier)
        with self.assertRaises(ValueError):gate.verify_request(env,self.recipient)
        accepted=gate.verify_request(env,self.verifier)
        with self.assertRaises(ValueError):gate.open_delivery(accepted['recipient_envelope'],self.sender,self.verifier)
        receipt=copy.deepcopy(accepted['receipt']);receipt['to']=self.sender
        with self.assertRaises(ValueError):gate.verify_receipt(receipt,accepted['recipient_envelope'],self.verifier)
    def test_plaintext_rejected(self):
        env=self.envelope();env['payload']['encrypted']=False
        with self.assertRaises(ValueError):gate.verify_request(env,self.verifier)
    def test_model_attribution_correction_preserves_identity_and_prior_evidence(self):
        name='proofbundle-relay-test-attribution'
        before=gate.register(name,'test-thread')
        path=Path(os.environ['PB_AGENT_ROOT'])/name/'aibom.json'
        raw=path.read_bytes();digest=hashlib.sha256(raw).hexdigest()
        after=gate.correct_model_card(name,'minimax-cn-coding-plan','MiniMax-M3.1-Flash-Preview','test native session metadata')
        self.assertEqual(after['key_fingerprint'],before['key_fingerprint'])
        self.assertEqual(after['enc_pubkey'],before['enc_pubkey'])
        self.assertEqual(after['pq_binding'],before['pq_binding'])
        self.assertEqual((path.parent/'aibom-history'/(digest+'.json')).read_bytes(),raw)
        self.assertEqual(after['aibom']['model_cards'][0]['provider'],'minimax-cn-coding-plan')
        self.assertEqual(after['aibom']['ancestry'][-1]['artifact_sha256'],digest)
        again=gate.correct_model_card(name,'minimax-cn-coding-plan','MiniMax-M3.1-Flash-Preview','test native session metadata')
        self.assertEqual(again['aibom_digest'],after['aibom_digest'])
        with self.assertRaises(ValueError):gate.correct_model_card(name,'minimax','','missing model')

if __name__=='__main__':unittest.main()
