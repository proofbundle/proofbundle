import fs from 'node:fs';

const [ledgerPath = 'ledger.jsonl', outPath = 'ledger_seq_hash.tsv'] = process.argv.slice(2);

const text = fs.readFileSync(ledgerPath, 'utf8');
const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
const out = [];

for (let i = 0; i < lines.length; i += 1) {
  const record = JSON.parse(lines[i]);
  out.push([
    i + 1,
    record.sequence ?? '',
    record.created_at_utc ?? '',
    record.from ?? '',
    record.to ?? '',
    record.record_sha256 ?? '',
  ].join('\t'));
}

fs.writeFileSync(outPath, `${out.join('\n')}\n`);
console.log(`exported=${lines.length}`);
console.log(`out=${outPath}`);
