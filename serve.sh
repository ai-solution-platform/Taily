#!/bin/bash
cd "$(dirname "$0")"
exec python3 -c "
import http.server, socketserver, os
os.chdir('$(pwd)')
handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(('', 8080), handler)
print('Taily server running on http://localhost:8080')
print('  App:   http://localhost:8080/app/')
print('  Admin: http://localhost:8080/admin/')
httpd.serve_forever()
"
