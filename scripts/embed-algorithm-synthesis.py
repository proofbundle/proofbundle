#!/usr/bin/env python3
"""Embed reconciled data for the operator's file-origin ProofBundle client."""
from pathlib import Path
import hashlib
import json

root=Path(__file__).resolve().parent.parent
data=json.loads((root/'ALGORITHM_SYNTHESIS.json').read_text())
assert data['schema']=='ProofBundleAlgorithmSynthesis/v1'
page=root/'proofbundle.html'
html=page.read_text()
marker='<div id="algorithm-synthesis"></div>'
anchor='  <div id="authoritative-registry"><span class="badge badge-orange">loading registry</span></div>'
if marker not in html:
    assert html.count(anchor)==1
    html=html.replace(anchor,anchor+'\n  '+marker)
begin='<!-- PB-ALGORITHM-SYNTHESIS-BEGIN -->'
end='<!-- PB-ALGORITHM-SYNTHESIS-END -->'
if begin in html:
    assert html.count(begin)==html.count(end)==1
    left,rest=html.split(begin);_,right=rest.split(end)
    if right.startswith('\n'):right=right[1:]
    html=left+right
encoded=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
js=(root/'ui/algorithm-synthesis.js').read_text()
block=f'{begin}\n<script id="pb-algorithm-synthesis-data" type="application/json">{encoded}</script>\n<script>\n{js}\n</script>\n{end}\n'
assert html.count('</body>')==1
html=html.replace('</body>',block+'</body>')
page.write_text(html)
print('embedded synthesis SHA-256',hashlib.sha256((root/'ALGORITHM_SYNTHESIS.json').read_bytes()).hexdigest())
