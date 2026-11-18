import json, hashlib, collections
q=3329

def dec12(data):
 out=[]
 for i in range(0,len(data),3):
  b0,b1,b2=data[i:i+3]
  out += [b0|((b1&15)<<8),(b1>>4)|(b2<<4)]
 return out

def cbd2(buf):
 # reference poly_cbd_eta2: each 32-bit t, d = t&0x55555555 + (t>>1)&...
 out=[]
 for i in range(0,128,4):
  t=int.from_bytes(buf[i:i+4],'little')
  d=(t & 0x55555555)+((t>>1)&0x55555555)
  for j in range(8):
   a=(d>>(4*j))&0x3; b=(d>>(4*j+2))&0x3
   out.append((a-b)%q)
 return out

def prf(seed,nonce,eta=2):
 return hashlib.shake_256(seed+bytes([nonce])).digest(64*eta)

j=json.load(open('/mnt/data/mlkem768_ground_truth.json'))
for vi,v in enumerate(j['vectors']):
 d=bytes.fromhex(v['d'])
 # G = sha3_512(d||k)
 g=hashlib.sha3_512(d+bytes([3])).digest(); rho,sigma=g[:32],g[32:]
 s=[];e=[]
 for i in range(3): s += cbd2(prf(sigma,i))
 for i in range(3): e += cbd2(prf(sigma,3+i))
 got=dec12(bytes.fromhex(v['dk'])[:1152])
 print(vi,'rho match',rho.hex()==v['ek'][-64:].lower(),'s exact',s==got,'s unique',collections.Counter(got).most_common())
 if s!=got:
  print(' first diff',next((i for i,(a,b) in enumerate(zip(s,got)) if a!=b),None),s[:16],got[:16])
