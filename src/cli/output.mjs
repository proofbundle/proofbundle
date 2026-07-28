// Two output modes: human-readable text, or deterministic JSON (stable key
// order, via JSON.stringify with an explicit replacer — object key order
// in the source object as written, not re-sorted, since these are
// hand-authored small objects where the written order already is the
// intended stable order).

export function printResult(obj, { json = false, quiet = false } = {}) {
  if (quiet) return;
  if (json) {
    process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
  } else {
    for (const [k, v] of Object.entries(obj)) {
      process.stdout.write(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}\n`);
    }
  }
}

export const EXIT_CODES = Object.freeze({
  OK: 0,
  VERIFICATION_FAILED: 1,
  USAGE_ERROR: 2,
  INTERNAL_ERROR: 70,
});
