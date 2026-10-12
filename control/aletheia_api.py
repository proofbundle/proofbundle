#!/usr/bin/env python3
"""Optional HTTP adapter. The desktop application does not start or depend on it."""
import argparse, json, pathlib, sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote
from aletheia_store import CustodyStore, REPO, canonical

class Handler(SimpleHTTPRequestHandler):
    store = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPO), **kwargs)

    def allowed(self, mutation=False):
        host = self.headers.get('Host', '')
        expected = {'127.0.0.1:' + str(self.server.server_port), 'localhost:' + str(self.server.server_port)}
        if host not in expected:
            self.send_json(403, {'error': 'Host is outside the local workbench'})
            return False
        origin = self.headers.get('Origin')
        if mutation and origin and origin not in {'http://' + v for v in expected}:
            self.send_json(403, {'error': 'Cross-origin mutations are refused'})
            return False
        if mutation and self.headers.get('Sec-Fetch-Site') == 'cross-site':
            self.send_json(403, {'error': 'Cross-site mutations are refused'})
            return False
        return True

    def send_json(self, status, value):
        raw = canonical(value).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if not self.allowed():
            return
        path = urlparse(self.path).path
        try:
            if path == '/api/aletheia/status':
                return self.send_json(200, self.store.status())
            if path == '/api/aletheia/latest':
                value = self.store.latest()
                return self.send_json(200 if value else 404, value or {'error': 'No saved checkpoint'})
            if path == '/api/aletheia/sources':
                return self.send_json(200, {'sources': self.store.source_status(),
                    'scripts': [{'path': '/home/falsealias/pb/bin/pb-memory-recall', 'available': pathlib.Path('/home/falsealias/pb/bin/pb-memory-recall').is_file()},
                                {'path': '/home/falsealias/pb/bin/pb-memory-resolve', 'available': pathlib.Path('/home/falsealias/pb/bin/pb-memory-resolve').is_file()}]})
            if path.startswith('/api/aletheia/blob/'):
                key = path.rsplit('/', 1)[-1]
                self.store.check_key(key)
                blob = self.store.blobs / key
                if not blob.is_file():
                    return self.send_json(404, {'error': 'Missing retained bytes'})
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Length', str(blob.stat().st_size))
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                with blob.open('rb') as f:
                    import shutil
                    shutil.copyfileobj(f, self.wfile)
                return
            # The served repository is a public workbench, not an arbitrary file
            # browser. Dotfiles, state, dependencies, and symlink escapes are denied.
            decoded = unquote(path)
            parts = pathlib.PurePosixPath(decoded).parts
            if any(p.startswith('.') or p in ['node_modules', 'work', 'target'] for p in parts if p != '/'):
                return self.send_json(403, {'error': 'Private source path'})
            target = (REPO / decoded.lstrip('/')).resolve()
            if target != REPO and REPO not in target.parents:
                return self.send_json(403, {'error': 'Source path escapes repository'})
            if target.is_dir():
                if decoded == '/':
                    self.path = '/proofbundle.html'
                else:
                    return self.send_json(403, {'error': 'Directory listings are disabled'})
            return super().do_GET()
        except (ValueError, FileNotFoundError) as e:
            return self.send_json(400, {'error': str(e)})

    def do_POST(self):
        if not self.allowed(mutation=True):
            return
        path = urlparse(self.path).path
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 0:
                raise ValueError('Invalid content length')
            if path.startswith('/api/aletheia/blob/'):
                return self.send_json(201, self.store.put_blob(path.rsplit('/', 1)[-1], self.rfile, length))
            if self.headers.get_content_type() != 'application/json' or length > 128 * 1024 * 1024:
                return self.send_json(413, {'error': 'A JSON request within 128 MiB is required'})
            body = json.loads(self.rfile.read(length))
            if path == '/api/aletheia/checkpoint':
                return self.send_json(201, self.store.save_snapshot(body))
            if path == '/api/aletheia/search':
                return self.send_json(200, self.store.search(body.get('source'), str(body.get('query', ''))[:500], body.get('limit', 6)))
            return self.send_json(404, {'error': 'Unknown workbench operation'})
        except (ValueError, FileNotFoundError, sqlite3.Error) as e:
            return self.send_json(400, {'error': str(e)})

    def log_message(self, fmt, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8099)
    parser.add_argument('--state-dir', required=True, help='Explicit directory for the independent custody database and blob copies')
    args = parser.parse_args()
    Handler.store = CustodyStore(args.state_dir)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print('Aletheia / ProofBundle: http://127.0.0.1:%s/' % server.server_port, flush=True)
    print('Custody database: ' + str(Handler.store.database), flush=True)
    server.serve_forever()


if __name__ == '__main__':
    main()
