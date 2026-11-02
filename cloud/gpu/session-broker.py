#!/usr/bin/env python3
"""Small password-to-short-lived-session broker; master credentials stay on VM."""
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ORIGIN = 'https://sitemap-polar.web.app'
MASTER = os.environ['SELKIES_MASTER_TOKEN']
PASSWORD = hashlib.sha256(os.environ['SELKIES_BASIC_AUTH_PASSWORD'].encode()).digest()
LOCK = threading.RLock()
session = None
attempts = {}

def provision(token=None):
    table = {token: {'role': 'controller', 'slot': None, 'mk_control': True}} if token else {}
    req = urllib.request.Request('http://127.0.0.1:8080/api/tokens', data=json.dumps(table).encode(),
        headers={'Authorization': 'Bearer ' + MASTER, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=8) as response:
        if response.status != 200:
            raise RuntimeError('Token provisioning failed')

def expire():
    global session
    while True:
        time.sleep(10)
        with LOCK:
            if session and session['expires'] < time.monotonic():
                try:
                    provision()
                    session = None
                except Exception:
                    pass

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # Never log request bodies, authorization tokens, or fragments.

    def reply(self, status, value):
        body = json.dumps(value).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', ORIGIN)
        self.send_header('Vary', 'Origin')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if self.headers.get('Origin') != ORIGIN:
            return self.reply(403, {'error': 'Origin refused'})
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'POST')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '600')
        self.end_headers()

    def do_GET(self):
        if self.path != '/player.html':
            return self.reply(404, {'error': 'Not found'})
        body = Path('/opt/polar-gpu/player.html').read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Security-Policy', "frame-ancestors " + ORIGIN)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        global session
        if self.headers.get('Origin') != ORIGIN:
            return self.reply(403, {'error': 'Origin refused'})
        try:
            size = int(self.headers.get('Content-Length', 0))
            if size < 2 or size > 4096:
                return self.reply(400, {'error': 'Invalid request'})
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError()
        except (ValueError, TypeError):
            return self.reply(400, {'error': 'Invalid request'})
        with LOCK:
            now = time.monotonic()
            try:
                if self.path == '/polar/session':
                    address = self.headers.get('X-Forwarded-For', self.client_address[0]).split(',')[-1].strip()
                    # Caddy overwrites the proxy header; keep the rate-limit table bounded.
                    for key in list(attempts):
                        if now - attempts[key][0] > 300:
                            del attempts[key]
                    record = attempts.setdefault(address, [now, 0])
                    record[1] += 1
                    if record[1] > 10 or len(attempts) > 5000:
                        return self.reply(429, {'error': 'Too many attempts. Please wait five minutes.'})
                    supplied = data.get('password', '')
                    if not isinstance(supplied, str) or not hmac.compare_digest(hashlib.sha256(supplied.encode()).digest(), PASSWORD):
                        return self.reply(401, {'error': 'That access code is incorrect.'})
                    if session and session['expires'] > now:
                        return self.reply(409, {'error': 'The journey is open on another device. Disconnect there, or wait 90 seconds after closing it.'})
                    token = secrets.token_urlsafe(32)
                    provision(token)
                    session = {'token': token, 'expires': now + 90}
                    attempts.pop(address, None)
                    return self.reply(200, {'token': token})
                token = data.get('token', '')
                if not isinstance(token, str) or not session or session['expires'] < now or not hmac.compare_digest(token, session['token']):
                    return self.reply(401, {'error': 'Your session expired. Please reconnect.'})
                if self.path == '/polar/heartbeat':
                    session['expires'] = now + 90
                    return self.reply(200, {'ok': True})
                if self.path == '/polar/end':
                    provision()
                    session = None
                    return self.reply(200, {'ok': True})
                return self.reply(404, {'error': 'Not found'})
            except Exception:
                return self.reply(503, {'error': 'The cloud renderer is starting. Please try again shortly.'})

if __name__ == '__main__':
    provision()  # Revoke orphaned credentials whenever the broker restarts.
    threading.Thread(target=expire, daemon=True).start()
    server = ThreadingHTTPServer(('127.0.0.1', 8090), Handler)
    server.daemon_threads = True
    server.serve_forever()
