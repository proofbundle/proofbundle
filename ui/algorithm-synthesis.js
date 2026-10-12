/* Algorithm evidence reconciliation. All source text is rendered as text. */
(() => {
  'use strict';
  const dataNode = document.getElementById('pb-algorithm-synthesis-data');
  const host = document.getElementById('algorithm-synthesis');
  if (!dataNode || !host) return;
  const data = JSON.parse(dataNode.textContent);
  const el = (tag, text, parent) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  };
  el('h3', 'Algorithm evidence', host);
  el('p', 'Follow an algorithm across implementations, historical entries and proof records. Each status applies to its named source.', host);
  const stats = el('div', undefined, host); stats.className = 'registry-pulse';
  for (const [count, label] of [[data.summary.application_entries,'application entries'],[data.summary.historical_unique_ids,'historical identifiers'],[data.summary.catalog_rows,'archive catalog rows'],[data.summary.proof_rows,'proof records']]) {
    const card=el('div',undefined,stats);card.className='registry-stat';
    el('strong',String(count),card);el('span',label,card);
  }
  const controls=el('div',undefined,host);controls.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin:16px 0';
  const search=el('input',undefined,controls);search.type='search';search.placeholder='Find an algorithm, implementation or proof';search.setAttribute('aria-label','Search algorithm evidence');search.style.flex='1';
  const surface=el('select',undefined,controls);surface.setAttribute('aria-label','Evidence source');
  for (const [value,label] of [['all','All evidence'],['application','Application implementations'],['history','Historical registry'],['catalog','Archive catalog'],['proofs','Proof records'],['profiles','Encryption profiles']]) {
    const option=el('option',label,surface);option.value=value;
  }
  const count=el('p','',host);
  const table=el('table',undefined,host);table.className='mini-table';
  const header=el('tr',undefined,el('thead',undefined,table));
  for(const label of ['Algorithm / profile','Source','Source status','Evidence'])el('th',label,header);
  const body=el('tbody',undefined,table);
  const paging=el('div',undefined,host);paging.style.cssText='display:flex;gap:10px;margin:12px 0';
  const previous=el('button','Previous',paging), next=el('button','Next',paging);
  previous.className=next.className='btn btn-secondary btn-sm';
  let page=0; const size=40;
  const surfaces=['application','history','catalog','proofs','profiles'];
  const combined=surfaces.flatMap(source=>data[source].map(row=>({...row,evidence_source:source})));
  function render() {
    const query=search.value.trim().toLowerCase();
    const candidates=surface.value==='all' ? combined : data[surface.value].map(row=>({...row,evidence_source:surface.value}));
    const rows=candidates.filter(row=>JSON.stringify(row).toLowerCase().includes(query));
    page=Math.max(0,Math.min(page,Math.max(0,Math.ceil(rows.length/size)-1)));
    body.replaceChildren();
    for(const row of rows.slice(page*size,(page+1)*size)) {
      const tr=el('tr',undefined,body);
      el('td',row.id || row.name,tr);
      el('td',row.evidence_source,tr);
      el('td',row.implementationStatus || row.status || 'catalog declaration; implementation not established',tr);
      const detail=el('details',undefined,el('td',undefined,tr));
      el('summary',row.evidence_source==='history' ? 'Historical declaration' : 'Inspect source record',detail);
      const pre=el('pre',JSON.stringify(row,null,2),detail);pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:380px;overflow:auto';
    }
    count.textContent=`${rows.length} matching records · page ${page+1} of ${Math.max(1,Math.ceil(rows.length/size))}`;
    previous.disabled=page===0;next.disabled=(page+1)*size>=rows.length;
  }
  search.addEventListener('input',()=>{page=0;render();});
  surface.addEventListener('change',()=>{page=0;render();});
  previous.addEventListener('click',()=>{page--;render();});next.addEventListener('click',()=>{page++;render();});
  const boundaries=el('details',undefined,host);el('summary','Reconciliation findings and source hashes',boundaries);
  for(const issue of data.conflicts)el('p',`${issue.algorithm}: ${issue.finding}`,boundaries);
  el('p',`${data.summary.historical_duplicate_rows} repeated identifier rows are preserved in the historical view.`,boundaries);
  for(const limit of data.limits)el('p',limit,boundaries);
  for(const source of data.sources)el('p',`${source.id} · SHA-256 ${source.sha256}`,boundaries);
  if(data.source_gitback) {
    const saved=el('details',undefined,host);el('summary','Preserved source development',saved);
    for(const repo of data.source_gitback.repositories) {
      el('p',`${repo.repository.split('/').pop()} · commit ${repo.after} · ${repo.files.length} preserved files`,saved);
    }
  }
  render();
})();
