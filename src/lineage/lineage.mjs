// Lineage as a directed acyclic graph over content-addressed nodes.
//
// Node ids are hashes of (nodeType, payload, sorted parent ids) under the
// DAG_NODE domain. That choice does the structural work:
//
//   - A node's id depends on its parents' ids, and a parent's id was fixed
//     before the child existed. Building a cycle would require a node whose
//     id is an input to its own hash, so cycles are not merely rejected by a
//     check — they are unconstructible through `addNode`. `detectCycle` still
//     exists and runs, because lineage graphs also arrive from untrusted
//     input where the ids are claimed rather than computed.
//   - Parents are sorted and de-duplicated before hashing, so parent ordering
//     is canonical and a duplicate parent cannot inflate an ancestor count.
//
// Traversal is bounded by an explicit step budget, so a hostile graph costs a
// bounded amount of work and ends in RESOURCE_EXHAUSTED rather than a hang.

import { digestBytes } from '../digest/digest.mjs';
import { bytesToHex } from '../encoding/hex.mjs';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';
import { DEFAULT_LIMITS, checkLimit, StepBudget } from '../limits.mjs';
import { MalformedInputError } from '../errors.mjs';

export const EDGE_TYPES = Object.freeze([
  'DERIVATION', 'TRANSFORMATION', 'SOURCE', 'EVIDENCE',
  'SUPERSESSION', 'REVOCATION', 'DISCLOSURE', 'REDACTION',
]);
const EDGE_TYPE_SET = new Set(EDGE_TYPES);

export const LINEAGE_DIGEST = 'SHA-256';

export function computeNodeId(nodeType, payload, parentIds, { digestAlg = LINEAGE_DIGEST } = {}) {
  const canonicalParents = [...new Set(parentIds)].sort();
  const transcript = buildTranscript(DOMAIN_TAGS.DAG_NODE, [nodeType, payload, ...canonicalParents]);
  return bytesToHex(digestBytes(digestAlg, transcript));
}

export function computeEdgeId(edgeType, fromId, toId, { digestAlg = LINEAGE_DIGEST } = {}) {
  if (!EDGE_TYPE_SET.has(edgeType)) throw new RangeError(`computeEdgeId: unregistered edge type ${JSON.stringify(edgeType)}`);
  return bytesToHex(digestBytes(digestAlg, buildTranscript(DOMAIN_TAGS.LINEAGE_EDGE, [edgeType, fromId, toId])));
}

export class LineageGraph {
  #nodes = new Map(); // id -> { id, nodeType, payload, parents: string[], edgeTypes: Map<parentId, type> }
  #limits;

  constructor({ limits = DEFAULT_LIMITS } = {}) { this.#limits = limits; }

  get size() { return this.#nodes.size; }
  has(id) { return this.#nodes.has(id); }
  get(id) { const n = this.#nodes.get(id); return n ? { ...n, parents: [...n.parents] } : undefined; }
  get nodeIds() { return [...this.#nodes.keys()]; }

  addNode({ nodeType, payload, parents = [], edgeType = 'DERIVATION' }) {
    if (typeof nodeType !== 'string' || !nodeType) throw new TypeError('addNode: nodeType must be a non-empty string');
    if (!(payload instanceof Uint8Array)) throw new TypeError('addNode: payload must be Uint8Array');
    if (!Array.isArray(parents)) throw new TypeError('addNode: parents must be an array');
    if (!EDGE_TYPE_SET.has(edgeType)) throw new RangeError(`addNode: unregistered edge type ${JSON.stringify(edgeType)}`);
    checkLimit(this.#nodes.size + 1, this.#limits.maxLineageNodes, 'lineage.nodeCount');
    checkLimit(parents.length, this.#limits.maxLineageParents, 'lineage.parentCount');

    // A duplicate parent is a malformed claim, not something to silently
    // de-duplicate: the caller believed it had two distinct ancestors.
    const seen = new Set();
    for (const p of parents) {
      if (typeof p !== 'string') throw new TypeError('addNode: parent ids must be strings');
      if (seen.has(p)) throw new MalformedInputError(`addNode: duplicate parent ${p}`, { predicate: 'lineage.parentsDistinct' });
      seen.add(p);
      if (!this.#nodes.has(p)) throw new MalformedInputError(`addNode: unknown parent ${p}`, { predicate: 'lineage.parentPresent' });
    }
    const id = computeNodeId(nodeType, payload, parents);
    if (seen.has(id)) throw new MalformedInputError('addNode: node is its own parent', { predicate: 'lineage.irreflexive' });
    if (this.#nodes.has(id)) return id; // identical content and ancestry is the same node
    const edgeTypes = new Map();
    for (const p of parents) edgeTypes.set(p, edgeType);
    this.#nodes.set(id, { id, nodeType, payload, parents: [...new Set(parents)].sort(), edgeTypes });
    return id;
  }

  // Bounded ancestor closure. Deterministic output order (sorted), so two
  // runs over the same graph produce identical results.
  ancestors(id, { budget = new StepBudget(this.#limits.maxTraversalSteps) } = {}) {
    if (!this.#nodes.has(id)) throw new MalformedInputError(`ancestors: unknown node ${id}`, { predicate: 'lineage.nodePresent' });
    const out = new Set();
    const stack = [id];
    let depth = 0;
    while (stack.length) {
      budget.tick();
      checkLimit(++depth, this.#limits.maxTraversalSteps, 'lineage.traversalSteps');
      const cur = stack.pop();
      for (const p of this.#nodes.get(cur).parents) {
        if (!out.has(p)) { out.add(p); stack.push(p); }
      }
    }
    return [...out].sort();
  }

  // Deterministic topological order: Kahn's algorithm with a sorted ready set,
  // so the output does not depend on Map iteration order.
  topologicalOrder({ budget = new StepBudget(this.#limits.maxTraversalSteps) } = {}) {
    const indegree = new Map();
    const children = new Map();
    for (const [id, n] of this.#nodes) {
      indegree.set(id, n.parents.length);
      for (const p of n.parents) {
        if (!children.has(p)) children.set(p, []);
        children.get(p).push(id);
      }
    }
    const ready = [...indegree.entries()].filter(([, d]) => d === 0).map(([id]) => id).sort();
    const order = [];
    while (ready.length) {
      budget.tick();
      const id = ready.shift();
      order.push(id);
      const kids = (children.get(id) ?? []).slice().sort();
      for (const c of kids) {
        const d = indegree.get(c) - 1;
        indegree.set(c, d);
        if (d === 0) { ready.push(c); ready.sort(); }
      }
    }
    if (order.length !== this.#nodes.size) {
      // Only reachable for a graph built by `fromClaimedEdges`, where ids are
      // asserted rather than derived.
      return { ok: false, failure: 'LINEAGE_CYCLE', ordered: order };
    }
    return { ok: true, order };
  }
}

// Untrusted input path: a lineage graph whose node ids are *claimed* by the
// producer rather than computed here. Everything must be checked — including
// cycles, which are impossible in the constructed path but perfectly possible
// in a hostile document.
export function checkClaimedLineage(nodes, { limits = DEFAULT_LIMITS } = {}) {
  if (!Array.isArray(nodes)) throw new MalformedInputError('checkClaimedLineage: nodes must be an array', { predicate: 'lineage.shape' });
  checkLimit(nodes.length, limits.maxLineageNodes, 'lineage.nodeCount');
  const byId = new Map();
  for (const n of nodes) {
    if (!n || typeof n.id !== 'string' || !Array.isArray(n.parents)) {
      return { ok: false, failure: 'LINEAGE_INVALID', reason: 'malformed node record' };
    }
    if (byId.has(n.id)) return { ok: false, failure: 'LINEAGE_INVALID', reason: `duplicate node id ${n.id}` };
    byId.set(n.id, n);
  }
  for (const n of nodes) {
    const seen = new Set();
    for (const p of n.parents) {
      if (p === n.id) return { ok: false, failure: 'LINEAGE_INVALID', reason: `self-parent on ${n.id}` };
      if (seen.has(p)) return { ok: false, failure: 'LINEAGE_INVALID', reason: `duplicate parent ${p} on ${n.id}` };
      seen.add(p);
      if (!byId.has(p)) return { ok: false, failure: 'LINEAGE_MISSING', reason: `missing parent ${p} of ${n.id}` };
    }
    if (n.parents.length > limits.maxLineageParents) {
      return { ok: false, failure: 'LIMIT_EXCEEDED', reason: `node ${n.id} declares ${n.parents.length} parents` };
    }
  }
  // Cycle detection by iterative DFS with an explicit budget.
  const budget = new StepBudget(limits.maxTraversalSteps);
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = new Map([...byId.keys()].map((k) => [k, WHITE]));
  for (const start of [...byId.keys()].sort()) {
    if (color.get(start) !== WHITE) continue;
    const stack = [{ id: start, i: 0 }];
    color.set(start, GREY);
    while (stack.length) {
      budget.tick();
      const frame = stack[stack.length - 1];
      const parents = byId.get(frame.id).parents;
      if (frame.i >= parents.length) { color.set(frame.id, BLACK); stack.pop(); continue; }
      const p = parents[frame.i++];
      const c = color.get(p);
      if (c === GREY) return { ok: false, failure: 'LINEAGE_CYCLE', reason: `cycle through ${p}` };
      if (c === WHITE) { color.set(p, GREY); stack.push({ id: p, i: 0 }); }
    }
  }
  return { ok: true, nodeCount: byId.size };
}
