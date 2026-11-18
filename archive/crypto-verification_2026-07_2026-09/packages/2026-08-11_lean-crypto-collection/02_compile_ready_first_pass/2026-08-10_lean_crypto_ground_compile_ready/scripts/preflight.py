#!/usr/bin/env python3
from pathlib import Path
import collections, re, sys
root = Path(__file__).resolve().parents[1]
targets = sorted((root/'repaired').glob('*.lean')) + sorted((root/'composites').glob('*.lean'))
forbidden = ['sorry','admit','axiom','unsafe','classical','propext','panic','get!']
decl_re = re.compile(r"(?m)^\s*(?:private\s+|protected\s+)?(?:def|theorem|lemma|abbrev|inductive|structure|class|opaque|axiom)\s+([A-Za-z_][\w']*)")

def code_stream(src):
    i=0; n=len(src); depth=0; line=False; string=False
    while i<n:
        if line:
            if src[i]=='\n': line=False; yield '\n', i
            i+=1; continue
        if depth:
            if src.startswith('/-',i): depth+=1; i+=2
            elif src.startswith('-/',i): depth-=1; i+=2
            else: i+=1
            continue
        if string:
            if src[i]=='\\': i+=2
            elif src[i]=='"': string=False; i+=1
            else: i+=1
            continue
        if src.startswith('--',i): line=True; i+=2
        elif src.startswith('/-',i): depth=1; i+=2
        elif src[i]=='"': string=True; i+=1
        else: yield src[i], i; i+=1

def stripped(src):
    out=[' ']*len(src)
    for ch,pos in code_stream(src): out[pos]=ch
    return ''.join(out)

def delimiters(src):
    pairs={')':'(',']':'[','}':'{'}; opens=set(pairs.values()); stack=[]; errors=[]
    for ch,pos in code_stream(src):
        if ch in opens: stack.append((ch,pos))
        elif ch in pairs:
            if not stack or stack[-1][0] != pairs[ch]: errors.append((ch,pos))
            else: stack.pop()
    return errors, stack

failed=False
print('file\tdelimiters\tduplicate_decls\tactive_forbidden')
for p in targets:
    src=p.read_text(errors='replace'); code=stripped(src)
    derr, unclosed=delimiters(src)
    names=[m.group(1) for m in decl_re.finditer(code)]
    dup=sorted(k for k,v in collections.Counter(names).items() if v>1)
    hits=[]
    for tok in forbidden:
        pat = re.compile(r'(?<![\w!])'+re.escape(tok)+r'(?![\w!])') if tok!='get!' else re.compile(r'(?<!\w)get!(?!\w)')
        if pat.search(code): hits.append(tok)
    ok = not derr and not unclosed
    rel=p.relative_to(root)
    print(f'{rel}\t{"ok" if ok else "FAIL"}\t{",".join(dup) or "-"}\t{",".join(hits) or "-"}')
    if not ok or dup or hits: failed=True
raise SystemExit(1 if failed else 0)
