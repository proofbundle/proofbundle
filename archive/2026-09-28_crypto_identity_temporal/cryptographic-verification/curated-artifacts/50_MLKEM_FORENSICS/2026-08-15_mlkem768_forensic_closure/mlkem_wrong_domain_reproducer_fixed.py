import json, hashlib
q=3329;n=256;k=3
zetas=[1,1729,2580,3289,2642,630,1897,848,1062,1919,193,797,2786,3260,569,1746,296,2447,1339,1476,3046,56,2240,1333,1426,2094,535,2882,2393,2879,1974,821,289,331,3253,1756,1197,2304,2277,2055,650,1977,2513,632,2865,33,1320,1915,2319,1435,807,452,1438,2868,1534,2402,2647,2617,1481,648,2474,3110,1227,910,17,2761,583,2649,1637,723,2288,1100,1409,2662,3281,233,756,2156,3015,3050,1703,1651,2789,1789,1847,952,1461,2687,939,2308,2437,2388,733,2337,268,641,1584,2298,2037,3220,375,2549,2090,1645,1063,319,2773,757,2099,561,2466,2594,2804,1092,403,1026,1143,2150,2775,886,1722,1212,1874,1029,2110,2935,885,2154]
gammas=[17,3312,2761,568,583,2746,2649,680,1637,1692,723,2606,2288,1041,1100,2229,1409,1920,2662,667,3281,48,233,3096,756,2573,2156,1173,3015,314,3050,279,1703,1626,1651,1678,2789,540,1789,1540,1847,1482,952,2377,1461,1868,2687,642,939,2390,2308,1021,2437,892,2388,941,733,2596,2337,992,268,3061,641,2688,1584,1745,2298,1031,2037,1292,3220,109,375,2954,2549,780,2090,1239,1645,1684,1063,2266,319,3010,2773,556,757,2572,2099,1230,561,2768,2466,863,2594,735,2804,525,1092,2237,403,2926,1026,2303,1143,2186,2150,1179,2775,554,886,2443,1722,1607,1212,2117,1874,1455,1029,2300,2110,1219,2935,394,885,2444,2154,1175]
def add(a,b): return (a+b)%q
def sub(a,b): return (a-b)%q
def mul(a,b): return (a*b)%q
def polyadd(a,b): return [(x+y)%q for x,y in zip(a,b)]
def ntt(f):
 f=[x%q for x in f]; kk=1; ln=128
 while ln>=2:
  for st in range(0,256,2*ln):
   z=zetas[kk]; kk+=1
   for j in range(st,st+ln):
    t=z*f[j+ln]%q
    f[j+ln]=(f[j]-t)%q
    f[j]=(f[j]+t)%q
  ln//=2
 return f
def invntt(f):
 f=[x%q for x in f]; kk=127; ln=2
 while ln<=128:
  for st in range(0,256,2*ln):
   z=zetas[kk];kk-=1
   for j in range(st,st+ln):
    t=f[j]; f[j]=(t+f[j+ln])%q; f[j+ln]=(z*(f[j+ln]-t))%q
  ln*=2
 return [(x*3303)%q for x in f]
def nttmul(f,g):
 h=[0]*256
 for i in range(0,256,2):
  a0,a1=f[i],f[i+1]; b0,b1=g[i],g[i+1]; ga=gammas[i//2]
  h[i]=(a0*b0 + (a1*b1%q)*ga)%q
  h[i+1]=(a0*b1+a1*b0)%q
 return h
def pointmul(f,g): return [(a*b)%q for a,b in zip(f,g)]
def negacyclic(f,g):
 out=[0]*256
 for i,a in enumerate(f):
  if a==0: continue
  for j,b in enumerate(g):
   idx=i+j
   if idx<256: out[idx]=(out[idx]+a*b)%q
   else: out[idx-256]=(out[idx-256]-a*b)%q
 return out
def cbd2(buf):
 out=[]
 for i in range(0,128,4):
  t=int.from_bytes(buf[i:i+4],'little'); d=(t&0x55555555)+((t>>1)&0x55555555)
  for j in range(8): out += [(((d>>(4*j))&3)-((d>>(4*j+2))&3))%q]
 return out
def sample_cbd(seed,nonce): return cbd2(hashlib.shake_256(seed+bytes([nonce])).digest(128))
def sample_ntt(rho,ii,jj):
 sh=hashlib.shake_128(rho+bytes([ii,jj])); # hashlib digest cannot stream incrementally after digest? generate generous
 buf=sh.digest(4096); out=[]; off=0
 while len(out)<256:
  if off+3>len(buf): raise RuntimeError('need more')
  d1=buf[off] | ((buf[off+1]&0x0f)<<8)
  d2=(buf[off+1]>>4) | (buf[off+2]<<4); off+=3
  if d1<q: out.append(d1)
  if len(out)<256 and d2<q: out.append(d2)
 return out
def dec12(data):
 out=[]
 for i in range(0,len(data),3):
  b0,b1,b2=data[i:i+3]; out += [b0|((b1&15)<<8),(b1>>4)|(b2<<4)]
 return out
def pack12(c):
 o=bytearray()
 for i in range(0,len(c),2):
  a,b=c[i]%q,c[i+1]%q; o += bytes([a&255,((a>>8)&15)|((b&15)<<4),(b>>4)&255])
 return bytes(o)

def key_material(v, orient='std'):
 d=bytes.fromhex(v['d']); g=hashlib.sha3_512(d+bytes([3])).digest();rho,sigma=g[:32],g[32:]
 s=[sample_cbd(sigma,i) for i in range(3)]; e=[sample_cbd(sigma,3+i) for i in range(3)]
 if orient=='std': A=[[sample_ntt(rho,j,i) for j in range(3)] for i in range(3)]
 else: A=[[sample_ntt(rho,i,j) for j in range(3)] for i in range(3)]
 return rho,s,e,A

def derive(v,variant):
 orient='trans' if variant.endswith('_trans') else 'std'; variant=variant.removesuffix('_trans')
 rho,s,e,A=key_material(v,orient)
 sh=[ntt(x) for x in s]; eh=[ntt(x) for x in e]
 t=[]
 for i in range(3):
  if variant=='standard':
   acc=eh[i]
   for j in range(3): acc=polyadd(acc,nttmul(A[i][j],sh[j]))
  elif variant=='nttmul_raws_rawe':
   acc=e[i]
   for j in range(3): acc=polyadd(acc,nttmul(A[i][j],s[j]))
  elif variant=='nttmul_sh_rawe':
   acc=e[i]
   for j in range(3): acc=polyadd(acc,nttmul(A[i][j],sh[j]))
  elif variant=='point_sh_eh':
   acc=eh[i]
   for j in range(3): acc=polyadd(acc,pointmul(A[i][j],sh[j]))
  elif variant=='point_raws_rawe':
   acc=e[i]
   for j in range(3): acc=polyadd(acc,pointmul(A[i][j],s[j]))
  elif variant=='coeff_Ainv_s_e':
   acc=e[i]
   for j in range(3): acc=polyadd(acc,negacyclic(invntt(A[i][j]),s[j]))
  elif variant=='coeff_Araw_s_e':
   acc=e[i]
   for j in range(3): acc=polyadd(acc,negacyclic(A[i][j],s[j]))
  else: raise ValueError(variant)
  t.append(acc)
 return pack12(sum(t,[]))+rho

j=json.load(open('/mnt/data/mlkem768_ground_truth.json'))
variants=[]
for base in ['standard','nttmul_raws_rawe','nttmul_sh_rawe','point_sh_eh','point_raws_rawe','coeff_Ainv_s_e','coeff_Araw_s_e']:
 variants += [base,base+'_trans']
# compare all 6
for var in variants:
 matches=[]; dist=[]
 for v in j['vectors']:
  got=derive(v,var); exp=bytes.fromhex(v['ek']); matches.append(got==exp); dist.append(sum(a!=b for a,b in zip(got,exp)))
 print(f'{var:26s}',matches,'byte_diffs',dist)
# emit standard first vector for compare with openssl text parsed elsewhere
open('std_ek0.bin','wb').write(derive(j['vectors'][0],'standard'))

def compress(x,d):
 # exact mathematical round(x*2^d/q), ties up; q odd no ties exactly? use integer formula
 return (((x<<d) + q//2)//q) & ((1<<d)-1)
def enc10(poly):
 o=bytearray()
 for i in range(0,256,4):
  vals=[compress(poly[i+j],10) for j in range(4)]
  x=vals[0]|(vals[1]<<10)|(vals[2]<<20)|(vals[3]<<30)
  o += x.to_bytes(5,'little')
 return bytes(o)
def enc4(poly):
 o=bytearray()
 for i in range(0,256,2): o.append(compress(poly[i],4)|(compress(poly[i+1],4)<<4))
 return bytes(o)
def msgpoly(m):
 out=[]
 for i in range(256): out.append(1665 if ((m[i//8]>>(i%8))&1) else 0)
 return out

def custom_encrypt(v):
 ek=bytes.fromhex(v['ek']); m=bytes.fromhex(v['m']); H=hashlib.sha3_256(ek).digest(); G=hashlib.sha3_512(m+H).digest(); rnd=G[32:]
 rho=ek[-32:]; t=[dec12(ek[384*i:384*(i+1)]) for i in range(3)]
 A=[[sample_ntt(rho,j,i) for j in range(3)] for i in range(3)]
 rr=[sample_cbd(rnd,i) for i in range(3)]; e1=[sample_cbd(rnd,3+i) for i in range(3)]; e2=sample_cbd(rnd,6)
 u=[]
 for i in range(3):
  acc=e1[i]
  for j in range(3): acc=polyadd(acc,negacyclic(A[j][i],rr[j]))
  u.append(acc)
 acc=e2
 for i in range(3): acc=polyadd(acc,negacyclic(t[i],rr[i]))
 vv=polyadd(acc,msgpoly(m))
 return b''.join(enc10(x) for x in u)+enc4(vv),G[:32]

print('\nCUSTOM CIPHERTEXT TEST')
for v in j['vectors']:
 ct,ss=custom_encrypt(v); exp=bytes.fromhex(v['ct'])
 print(v['name'],'ctmatch',ct==exp,'diffs',sum(a!=b for a,b in zip(ct,exp)),'ssmatch',ss.hex()==v['ss'].lower())

def decompress(y,d): return (y*q + (1<<(d-1)))>>d
def dec10(b):
 out=[]
 for i in range(0,len(b),5):
  x=int.from_bytes(b[i:i+5],'little')
  out += [decompress((x>>(10*j))&1023,10)%q for j in range(4)]
 return out
def dec4(b):
 out=[]
 for x in b:
  out += [decompress(x&15,4)%q,decompress(x>>4,4)%q]
 return out
def enc1(poly):
 o=bytearray(32)
 for i,x in enumerate(poly): o[i//8] |= (compress(x,1)&1)<<(i%8)
 return bytes(o)
def custom_pke_encrypt(ek,m,rnd):
 rho=ek[-32:]; t=[dec12(ek[384*i:384*(i+1)]) for i in range(3)]
 A=[[sample_ntt(rho,j,i) for j in range(3)] for i in range(3)]
 rr=[sample_cbd(rnd,i) for i in range(3)]; e1=[sample_cbd(rnd,3+i) for i in range(3)]; e2=sample_cbd(rnd,6)
 u=[]
 for i in range(3):
  acc=e1[i]
  for jj in range(3): acc=polyadd(acc,negacyclic(A[jj][i],rr[jj]))
  u.append(acc)
 acc=e2
 for i in range(3): acc=polyadd(acc,negacyclic(t[i],rr[i]))
 vv=polyadd(acc,msgpoly(m))
 return b''.join(enc10(x) for x in u)+enc4(vv)
def custom_decrypt(dk,ct):
 s=[dec12(dk[384*i:384*(i+1)]) for i in range(3)]
 u=[dec10(ct[320*i:320*(i+1)]) for i in range(3)]
 v=dec4(ct[960:])
 mask=[0]*256
 for i in range(3): mask=polyadd(mask,negacyclic(s[i],u[i]))
 w=[(a-b)%q for a,b in zip(v,mask)]
 return enc1(w)
def custom_decaps(dk,ct):
 if len(dk)!=2400 or len(ct)!=1088: return None,'REJECT_LENGTH',None,None
 ek=dk[1152:2336]; h=dk[2336:2368]; z=dk[2368:2400]
 m=custom_decrypt(dk,ct); G=hashlib.sha3_512(m+h).digest(); kp,r=G[:32],G[32:]
 c1=custom_pke_encrypt(ek,m,r)
 jout=hashlib.shake_256(z+ct).digest(32)
 if c1==ct:return kp,'ACCEPT',m,c1
 return jout,'IMPLICIT_REJECTION',m,c1

print('\nHOSTILE CUSTOM DECAP TEST')
for h in j['hostile']:
 if h.get('dk') is None or h.get('ct') is None:
  print(h['name'],'NOT_BYTE_EXECUTABLE','expected',h.get('expected_verdict'))
  continue
 dk=bytes.fromhex(h['dk']); ct=bytes.fromhex(h['ct']); got,ver,m,c1=custom_decaps(dk,ct)
 exp=(h.get('expected_shared_secret') or '').lower(); ok=(not exp) or (got is not None and got.hex()==exp)
 ev=h['expected_verdict']; classok=('REJECT' in ev and ver=='REJECT_LENGTH') or ('IMPLICIT_REJECTION' in ev and ver=='IMPLICIT_REJECTION') or ('ACCEPT' in ev and ver=='ACCEPT')
 print(h['name'],ver,'secret_match',ok,'verdict_match',classok)
