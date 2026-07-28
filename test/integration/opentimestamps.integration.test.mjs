// Integration tests: the first two hit the real, live OpenTimestamps
// calendar over the network. That is deliberate — this module exists
// specifically because a prior claim that timestamping services were
// unreachable from this environment was never actually tested. If network
// access is unavailable when this runs, these two tests report that
// honestly (via a skip with the real cause) rather than silently passing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { submitDigest, submitToCalendars, parseTimestampResponse, pendingCalendarUris, DEFAULT_CALENDARS } from '../../src/timestamp/opentimestamps.mjs';

async function networkReachable() {
  try {
    const res = await fetch('https://api.github.com', { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

test('live: submitting a real digest to the real calendars returns at least one valid, fully-parseable proof', async (t) => {
  if (!(await networkReachable())) {
    t.skip('no network reachability from this environment right now — see reports/ for the last time this was confirmed working');
    return;
  }
  const digest = createHash('sha256').update(`proofbundle-integration-test-${Date.now()}`).digest();
  // Submitted to both default calendars, not one — a single calendar was
  // observed this session to return an intermittent HTTP 503 (the
  // calendar's own edge-to-origin TLS handshake failing, not a client
  // problem; see the comment on submitToCalendars). Requiring only 1 of 2
  // to succeed reflects how this protocol is actually meant to be used.
  const { succeeded, failed } = await submitToCalendars(new Uint8Array(digest), DEFAULT_CALENDARS, { minSuccesses: 1 });
  assert.ok(succeeded.length >= 1, `expected at least one calendar to succeed; failures: ${JSON.stringify(failed)}`);
  for (const { raw, tree, calendarUrl } of succeeded) {
    assert.ok(raw.length > 0, `${calendarUrl} returned a non-empty response`);
    const uris = pendingCalendarUris(tree);
    assert.ok(uris.length >= 1, `${calendarUrl} response contains at least one pending-calendar URI`);
    assert.ok(uris.every((u) => u.startsWith('https://')), 'every calendar URI is HTTPS');
  }
});

test('live: two submissions of two different digests produce different response bytes', async (t) => {
  if (!(await networkReachable())) {
    t.skip('no network reachability from this environment right now');
    return;
  }
  const d1 = createHash('sha256').update('proofbundle-a').digest();
  const d2 = createHash('sha256').update('proofbundle-b').digest();
  const r1 = await submitToCalendars(new Uint8Array(d1), DEFAULT_CALENDARS, { minSuccesses: 1 });
  const r2 = await submitToCalendars(new Uint8Array(d2), DEFAULT_CALENDARS, { minSuccesses: 1 });
  const hex1 = Buffer.from(r1.succeeded[0].raw).toString('hex');
  const hex2 = Buffer.from(r2.succeeded[0].raw).toString('hex');
  assert.notEqual(hex1, hex2);
});

// ---- offline tests: replay the real bytes captured during this session's
// own live submission, so the parser stays covered even with no network.

test('offline replay: the exact response captured live this session parses to the exact URI captured live', () => {
  const raw = new Uint8Array(readFileSync('vectors/timestamps/ots-live-capture-response.bin'));
  const tree = parseTimestampResponse(raw);
  const uris = pendingCalendarUris(tree);
  assert.deepEqual(uris, ['https://alice.btc.calendar.opentimestamps.org']);
});

test('offline replay: parser consumes every byte of the real captured response with no trailing garbage', () => {
  const raw = new Uint8Array(readFileSync('vectors/timestamps/ots-live-capture-response.bin'));
  // parseTimestampResponse itself throws on trailing garbage, so reaching
  // this line without throwing already proves consumption was exact; the
  // explicit check below is redundant on purpose, matching how this bug
  // was actually found this session (an unconsumed-byte count in a
  // stand-alone probe script before the check was built into the parser).
  assert.doesNotThrow(() => parseTimestampResponse(raw));
});

test('offline: parseTimestampResponse rejects truncated input rather than returning a partial tree', () => {
  const raw = readFileSync('vectors/timestamps/ots-live-capture-response.bin');
  const truncated = new Uint8Array(raw.subarray(0, raw.length - 5));
  assert.throws(() => parseTimestampResponse(truncated));
});

test('offline: parseTimestampResponse rejects a response with an unknown operation tag', () => {
  const raw = new Uint8Array(readFileSync('vectors/timestamps/ots-live-capture-response.bin'));
  const corrupted = raw.slice();
  corrupted[0] = 0xaa; // not a registered op tag, not 0x00, not 0xff
  assert.throws(() => parseTimestampResponse(corrupted), /unexpected marker byte/);
});

test('offline: submitDigest rejects a non-32-byte digest before attempting any network call', async () => {
  await assert.rejects(() => submitDigest(new Uint8Array(16)), /expected a 32-byte SHA-256 digest/);
});
