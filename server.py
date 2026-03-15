import http.server
import socketserver
import os
import sys

# Use script's own directory to avoid getcwd() sandbox issues
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(SCRIPT_DIR)

PORT = 8080

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}", flush=True)
    print(f"  App: http://localhost:{PORT}/app/", flush=True)
    print(f"  Admin: http://localhost:{PORT}/admin/", flush=True)
    httpd.serve_forever()
