/**
 * Agent decision hooks — how agents react to routed messages.
 *
 * An agent's decision module defines what to do when an envelope arrives in
 * its inbox: inspect the payload, decide whether to act, seal a response.
 * This is the reactive layer — the "respond to stimulus" part of the
 * thalamic-cortico loop.
 *
 * Hooks are installed per-agent and per-message-type. Each hook receives
 * the full envelope (verified + lineage-bound) and returns either:
 *   - { action: 'accept' } — silently record the message
 *   - { action: 'respond', response: <payload> } — seal and route a reply
 *   - { action: 'ignore', reason: <string> } — decline, do not respond
 *   - { action: 'escalate', reason: <string> } — mark as requiring operator review
 *
 * This prevents silent failures: every routed message gets a decision record.
 */

/**
 * Default hook — accepts any valid envelope without decision logic.
 * Override in agent-specific config.
 * @param {object} envelope — full sealed envelope with lineage assurance
 * @param {string} agentId — this agent's own ID (recipient)
 * @returns {object} decision record
 */
export function defaultHook(envelope, agentId) {
  return {
    action: 'accept',
    reason: 'default hook accepts all valid envelopes',
    from: envelope.from.agent_id,
    payload_type: envelope.payload_type,
  };
}

/**
 * Hook registry — agents install their own handlers by type and sender.
 * Format: { [agentId]: { [payloadType]: fn, [agentId:payloadType]: fn, ... } }
 * Fallthrough: try sender-specific hook, then type-specific, then default.
 */
class HookRegistry {
  constructor() {
    this.hooks = {};
  }

  register(agentId, payloadType, fn) {
    if (!this.hooks[agentId]) this.hooks[agentId] = {};
    this.hooks[agentId][payloadType] = fn;
  }

  registerPerSender(agentId, senderAgentId, payloadType, fn) {
    if (!this.hooks[agentId]) this.hooks[agentId] = {};
    const key = `${senderAgentId}:${payloadType}`;
    this.hooks[agentId][key] = fn;
  }

  /**
   * Resolve a hook for an envelope arriving at an agent.
   * Tries (in order): sender-specific handler, type-specific handler, default.
   * @returns {function} the hook to call
   */
  resolve(agentId, envelope) {
    if (!this.hooks[agentId]) return defaultHook;
    const key = `${envelope.from.agent_id}:${envelope.payload_type}`;
    if (this.hooks[agentId][key]) return this.hooks[agentId][key];
    if (this.hooks[agentId][envelope.payload_type]) return this.hooks[agentId][envelope.payload_type];
    return defaultHook;
  }
}

export const registry = new HookRegistry();

/**
 * Process an arriving envelope through its agent's decision hook.
 * @param {object} envelope — verified + lineage-bound envelope
 * @param {string} agentId — recipient agent ID
 * @returns {object} { decision, envelope_seq, ts, agent_id }
 */
export function decideOnEnvelope(envelope, agentId) {
  const hook = registry.resolve(agentId, envelope);
  const decision = hook(envelope, agentId);
  return {
    agent_id: agentId,
    envelope_seq: envelope.seq,
    ts: new Date().toISOString(),
    from: envelope.from.agent_id,
    payload_type: envelope.payload_type,
    decision,
  };
}

/**
 * Common hook: react to attestation messages (claims, confirmations, findings).
 * Logs them but doesn't automatically respond (prevents reply loops).
 */
export function attestationHook(envelope, agentId) {
  const body = envelope.payload.body || {};
  return {
    action: 'accept',
    reason: 'logged attestation',
    kind: body.kind || 'unknown',
    from: envelope.from.agent_id,
  };
}

/**
 * Common hook: react to work-complete messages. Default is to accept + log.
 * Override to implement chaining (trigger next phase when predecessor finishes).
 */
export function workCompleteHook(envelope, agentId) {
  const body = envelope.payload.body || {};
  return {
    action: 'accept',
    reason: 'logged work completion',
    from: envelope.from.agent_id,
    message: body.message ? body.message.slice(0, 100) : null,
  };
}

/**
 * Common hook: react to verification/findings. If the finding is about
 * work this agent owns, respond with an ack or objection.
 */
export function verificationHook(envelope, agentId) {
  // Example: if the verifier found an issue in my code, do I want to respond?
  // For now, just log it.
  const body = envelope.payload.body || {};
  return {
    action: 'accept',
    reason: 'logged verification',
    from: envelope.from.agent_id,
    target: body.target_seq || body.target_agent || null,
  };
}

export default registry;
