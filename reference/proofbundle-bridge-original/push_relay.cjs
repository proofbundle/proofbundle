const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 7373;
const VM = '34.82.185.223';
const SSH_KEY = 'C:/Users/alib90/.ssh/gcp_extract_20260525';
const BRIDGE_DIR = 'C:/Users/alib90/Downloads/ORGANIZED/AGENT_COORDINATION/proofbundles/codex_peer_bridge_20260508';

function sshCmd(cmd) {
  return `ssh -o StrictHostKeyChecking=no -o IdentitiesOnly=yes -i "${SSH_KEY}" -l alib90 ${VM} 'sudo bash -c "${cmd.replace(/"/g, '\\"')}"'`;
}

function routeToVM(msg) {
  const escaped = msg.replace(/"/g, '\\"').replace(/\$/g, '\$');
  const cmd = sshCmd(`echo \"${escaped}\" > /data/agents/relay/RELAY.txt`);
  try {
    execSync(cmd, { timeout: 10000, stdio: 'pipe' });
    return { ok: true, route: 'vm_relay' };
  } catch (e) {
    return { ok: false, route: 'vm_relay', error: e.message.slice(0, 200) };
  }
}

function routeToBridge(from, to, msg) {
  try {
    const text = `[${from} -> ${to}] ${msg}`;
    const cmd = `cd "${BRIDGE_DIR}" && node proofbundle_peer_bridge.mjs send --from "${from}" --to "${to}" --type "AgentRelay" --text "${text.replace(/"/g, '\\"')}"`;
    execSync(cmd, { timeout: 15000, stdio: 'pipe' });
    return { ok: true, route: 'bridge' };
  } catch (e) {
    return { ok: false, route: 'bridge', error: e.message.slice(0, 200) };
  }
}

function routeToLocalFile(from, msg) {
  const dir = 'C:/Users/alib90/Downloads/ORGANIZED/AGENT_COORDINATION/proofbundles/codex_peer_bridge_20260508/bridge_notifications';
  const file = path.join(dir, 'claude-sonnet-46-20260522.inbox.jsonl');
  const record = JSON.stringify({
    from,
    to: 'claude-sonnet-46-20260522',
    type: 'AgentRelay',
    timestamp: new Date().toISOString(),
    body: msg
  });
  fs.writeFileSync(file, record + '\n', { flag: 'a' });
  return { ok: true, route: 'local_inbox' };
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/push') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { to, from, message, urgency = 'normal' } = data;
      if (!to || !from || !message) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing to/from/message' }));
        return;
      }

      const results = [];

      // Always log to bridge
      results.push(routeToBridge(from, to, message));

      // Route based on target
      if (to.startsWith('kimi') || to === 'vm') {
        results.push(routeToVM(message));
      }
      if (to === 'claude' || to === 'local') {
        results.push(routeToLocalFile(from, message));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, routes: results, urgency }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Agent Push Relay listening on http://127.0.0.1:${PORT}/push`);
  console.log(`POST {to, from, message, urgency?}`);
});
