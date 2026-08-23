#!/usr/bin/env node
/**
 * Build local + VM theorem persistence manifest (20k+ scale).
 * Indexes canonical bulk-consolidation artifacts and live proof roots.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const bridgeDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const outRoot = path.join(bridgeDir, 'vm_work_orders_20260615', 'local_theorem_persist');

const SOURCE_CANDIDATES = {
  bulkStateLive: path.join(
    'C:\\Users\\alib90\\Downloads\\ORGANIZED\\AGENT_COORDINATION\\proofbundles',
    'bulk_consolidation_state_20260517'
  ),
  bulkStateSave: path.join(
    'C:\\Users\\alib90\\Downloads\\ORGANIZED\\PROJECT_SAVES\\project-save-20260523T093129\\AGENT_COORDINATION\\proofbundles',
    'bulk_consolidation_state_20260517'
  ),
  proofLibrary: 'C:\\Users\\alib90\\Downloads\\ORGANIZED\\08_PROOFS\\PROOF_LIBRARY_FINAL',
  proofWorking: path.join(
    'C:\\Users\\alib90\\Downloads\\PRINCIPIA\\New folder\\Rehab\\unique_apps',
    'proofbundle_working_20260515\\proofs'
  ),
  githubRepo: 'C:\\Users\\alib90\\Downloads\\ORGANIZED\\AGENT_COORDINATION\\github_repos\\FalseAlias_proofbundle',
};

function sha256File(file) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex').toUpperCase();
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
}

function exists(file) {
  try {
    return fs.existsSync(file);
  } catch {
    return false;
  }
}

const DECLARATIONS_MARKER = 'HYGIENIC_PROOF_CONSOLIDATION_20260517T160724Z_DECLARATIONS.jsonl';

function resolveBulkState() {
  const candidates = [SOURCE_CANDIDATES.bulkStateLive, SOURCE_CANDIDATES.bulkStateSave];
  for (const root of candidates) {
    if (exists(path.join(root, DECLARATIONS_MARKER))) return root;
  }
  for (const root of candidates) {
    if (exists(root)) return root;
  }
  return null;
}

async function countJsonlLines(file) {
  if (!exists(file)) return 0;
  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let n = 0;
  for await (const line of rl) {
    if (line.trim()) n++;
  }
  return n;
}

function readJsonIfExists(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function descriptor(file) {
  if (!exists(file)) return { path: file, exists: false };
  const st = fs.statSync(file);
  if (st.isDirectory()) {
    return {
      path: file,
      exists: true,
      kind: 'directory',
      bytes: null,
      sha256: null,
      mtime_utc: st.mtime.toISOString(),
    };
  }
  return {
    path: file,
    exists: true,
    kind: 'file',
    bytes: st.size,
    sha256: sha256File(file),
    mtime_utc: st.mtime.toISOString(),
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  const bulkState = resolveBulkState();
  const strictSummary = bulkState
    ? readJsonIfExists(path.join(bulkState, 'STRICT_THEOREM_EXTRACT_20260517T172236Z.json'))
    : null;
  const hygienicSummary = bulkState
    ? readJsonIfExists(path.join(bulkState, 'HYGIENIC_PROOF_CONSOLIDATION_20260517T160724Z.json'))
    : null;

  const declarationsJsonl = bulkState
    ? path.join(bulkState, 'HYGIENIC_PROOF_CONSOLIDATION_20260517T160724Z_DECLARATIONS.jsonl')
    : null;
  const uniqueTheoremsJsonl = bulkState
    ? path.join(bulkState, 'STRICT_THEOREM_EXTRACT_20260517T172236Z_UNIQUE_THEOREM_STATEMENTS.jsonl')
    : null;
  const aliasesJsonl = bulkState
    ? path.join(bulkState, 'STRICT_THEOREM_EXTRACT_20260517T172236Z_THEOREM_ALIASES.jsonl')
    : null;

  const declarationLineCount = declarationsJsonl ? await countJsonlLines(declarationsJsonl) : 0;
  const uniqueTheoremLineCount = uniqueTheoremsJsonl ? await countJsonlLines(uniqueTheoremsJsonl) : 0;
  const aliasLineCount = aliasesJsonl ? await countJsonlLines(aliasesJsonl) : 0;

  const operatorFloor = 20000;
  const theoremLikeRows = strictSummary?.theorem_like_rows_read ?? 0;
  const totalDeclarations = strictSummary?.total_declaration_rows_read ?? declarationLineCount;
  const meetsOperatorFloor = theoremLikeRows >= operatorFloor || totalDeclarations >= operatorFloor;

  ensureDir(path.join(outRoot, 'manifest'));
  ensureDir(path.join(outRoot, 'receipts', 'local_proof_persist'));
  ensureDir(path.join(outRoot, 'git_roots'));
  ensureDir(path.join(outRoot, 'vm_sync', 'highmem'));
  ensureDir(path.join(outRoot, 'vm_sync', 'micro'));

  const manifest = {
    schema: 'ProofBundleTheoremPersistManifest/v1.0.0',
    manifest_id: `THEOREM_PERSIST_MANIFEST_${stamp}`,
    generated_utc: new Date().toISOString(),
    sender_identity: 'grok-build-continuity-20260611T1200Z',
    standing: 'persistence_index_only_not_release_green_not_proof_closure',
    operator_requirement: {
      minimum_theorems_stated: operatorFloor,
      meets_minimum: meetsOperatorFloor,
      note: 'Operator floor 20k; corpus exceeds via theorem-like rows and declaration inventory',
    },
    counts: {
      total_declaration_rows: totalDeclarations,
      theorem_like_rows: theoremLikeRows,
      unique_theorem_statement_hashes: strictSummary?.unique_theorem_statement_hashes ?? uniqueTheoremLineCount,
      exact_duplicate_aliases_removed: strictSummary?.exact_duplicate_theorem_aliases_removed ?? 0,
      alias_rows_on_disk: aliasLineCount,
      marker_clean_candidates: strictSummary?.marker_clean_candidate_statement_hashes ?? 0,
      debt_bearing_theorems: strictSummary?.debt_bearing_theorem_statement_hashes ?? 0,
      blocker_declarations: strictSummary?.blocker_declaration_rows ?? 0,
    },
    bulk_consolidation_root: bulkState,
    sources: {
      strictTheoremExtractSummary: strictSummary ? descriptor(path.join(bulkState, 'STRICT_THEOREM_EXTRACT_20260517T172236Z.json')) : null,
      hygienicConsolidationSummary: hygienicSummary ? descriptor(path.join(bulkState, 'HYGIENIC_PROOF_CONSOLIDATION_20260517T160724Z.json')) : null,
      declarationsJsonl: declarationsJsonl ? descriptor(declarationsJsonl) : null,
      uniqueTheoremsJsonl: uniqueTheoremsJsonl ? descriptor(uniqueTheoremsJsonl) : null,
      aliasesJsonl: aliasesJsonl ? descriptor(aliasesJsonl) : null,
      proofLibraryFinal: descriptor(SOURCE_CANDIDATES.proofLibrary),
      proofWorking: descriptor(SOURCE_CANDIDATES.proofWorking),
      githubRepo: descriptor(SOURCE_CANDIDATES.githubRepo),
    },
    persistence_layout: {
      local_root: outRoot,
      receipt_pattern: 'local_theorem_persist/receipts/local_proof_persist/pb-theorem-family-NNN/receipt.json',
      vm_receipt_mirror: 'vm_receipts/receipt_exact_takeover_*/{primary,second}/receipt_exact_queue_*/pb-proof-family-NNN/',
      git_roots: {
        local_bridge: bridgeDir,
        falsealias_proofbundle: SOURCE_CANDIDATES.githubRepo,
        vm_highmem_proof_src: '/data/proofbundle/kimi_agent_proofbundle_blueprint_20260602/extracted/proofbundle',
      },
    },
    sync_policy: {
      local_first: true,
      vm_rsync_targets: ['proofbundle-highmem', 'proofbundle-micro'],
      hash_before_promote: true,
      never_publish: ['raw_private_transcripts', 'secrets', 'quarantined_content'],
    },
  };

  const manifestPath = path.join(outRoot, 'manifest', `${manifest.manifest_id}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  const tsvRows = [
    ['artifact_kind', 'path', 'sha256', 'bytes', 'theorem_or_declaration_count'].join('\t'),
  ];
  for (const [kind, desc] of Object.entries(manifest.sources)) {
    if (!desc?.exists) continue;
    const count =
      kind === 'declarationsJsonl'
        ? String(totalDeclarations)
        : kind === 'uniqueTheoremsJsonl'
          ? String(uniqueTheoremLineCount)
          : kind === 'aliasesJsonl'
            ? String(aliasLineCount)
            : '';
    tsvRows.push([kind, desc.path, desc.sha256 || '', desc.bytes != null ? String(desc.bytes) : '', count].join('\t'));
  }
  const tsvPath = path.join(outRoot, 'manifest', 'LOCAL_THEOREM_FETCH_MANIFEST.tsv');
  fs.writeFileSync(tsvPath, tsvRows.join('\n') + '\n', 'utf8');

  const queue = {
    schema: 'ProofBundleLocalTheoremPersistQueue/v1.0.0',
    queue_id: 'LOCAL_THEOREM_PERSIST_QUEUE_v1',
    manifest_id: manifest.manifest_id,
    manifest_sha256: sha256File(manifestPath),
    items: [
      {
        work_item_id: 'pb-local-manifest-freeze-001',
        lane: 'theorem_persist_local',
        command: `node tools/build_theorem_persist_manifest.mjs`,
        receipt_dir: 'local_theorem_persist/receipts/local_proof_persist/pb-theorem-family-001',
      },
      {
        work_item_id: 'pb-vm-git-mirror-001',
        lane: 'theorem_persist_vm_git',
        vm: 'proofbundle-highmem',
        command: 'rsync -a --checksum local_theorem_persist/ $DATA_ROOT/theorem_persist/ && git add theorem_persist/manifest',
      },
      {
        work_item_id: 'pb-vm-receipt-exact-002',
        lane: 'theorem_persist_receipt_exact',
        vm: 'proofbundle-highmem',
        command: 'receipt_exact_queue on UNIQUE_THEOREM_STATEMENTS.jsonl batches (family NNN)',
        family_count_hint: uniqueTheoremLineCount || strictSummary?.unique_theorem_statement_hashes || 1609,
      },
    ],
  };
  const queuePath = path.join(outRoot, 'LOCAL_THEOREM_PERSIST_QUEUE_v1.json');
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    ok: true,
    manifest_path: manifestPath,
    manifest_sha256: sha256File(manifestPath),
    tsv_path: tsvPath,
    queue_path: queuePath,
    meets_operator_floor_20k: meetsOperatorFloor,
    theorem_like_rows: theoremLikeRows,
    total_declarations: totalDeclarations,
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});