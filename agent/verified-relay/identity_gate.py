"""JSON subprocess adapter to the existing ProofBundle cryptographic primitives."""
import json
import fcntl
import os
import subprocess
from pathlib import Path

DEFAULT_VERIFIER = 'proofbundle-verifier-20261011'
GATE = Path(__file__).with_suffix('.mjs')

def _call(op, **values):
    result = subprocess.run(['node', str(GATE)], input=json.dumps(dict(op=op, **values)),
                            text=True, capture_output=True, timeout=60)
    if result.returncode:
        # Error text contains no payload or key material.
        raise ValueError(result.stderr.strip() or 'identity gate failed')
    return json.loads(result.stdout)

def register(agent_id, thread_id=None):
    root=Path(os.environ.get('PB_AGENT_ROOT',str(Path.home()/'.proofbundle/agent')))
    lock_path = root/'.communication-register.lock'
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        return _call('register', agent_id=agent_id, thread_id=thread_id)

def identity(agent_id):
    return _call('identity', agent_id=agent_id)

def seal_request(frm, to, payload, verifier=DEFAULT_VERIFIER, profile=None):
    return _call('seal', frm=frm, to=to, payload=payload, verifier=verifier, profile=profile)

def verify_request(envelope, verifier=DEFAULT_VERIFIER):
    return _call('verify', envelope=envelope, verifier=verifier)

def open_delivery(envelope, agent_id, verifier=DEFAULT_VERIFIER):
    return _call('open', envelope=envelope, agent_id=agent_id, verifier=verifier)

def verify_receipt(receipt, envelope, verifier=DEFAULT_VERIFIER):
    return _call('receipt', receipt=receipt, envelope=envelope, verifier=verifier)
