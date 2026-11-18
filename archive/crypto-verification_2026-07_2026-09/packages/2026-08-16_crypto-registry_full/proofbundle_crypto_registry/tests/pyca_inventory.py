import inspect,json
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import algorithms,modes,aead
from cryptography.hazmat.primitives.asymmetric import ec
o=[]
for t,m in [("hash",hashes),("cipher",algorithms),("mode",modes),("aead",aead),("curve",ec)]:
  for n,x in vars(m).items():
    if not n.startswith("_") and inspect.isclass(x) and getattr(x,"__module__","").startswith("cryptography"): o.append([t,n,x.__module__])
print(json.dumps(o))