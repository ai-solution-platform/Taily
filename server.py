import http.server
import socketserver
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 8080

Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print(f"  App: http://localhost:{PORT}/app/")
    print(f"  Admin: http://localhost:{PORT}/admin/")
    httpd.serve_forever()
