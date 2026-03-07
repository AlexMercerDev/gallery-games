import http.server
import socketserver
import json
import os
from datetime import datetime

PORT = 8000
DATA_FILE = "ratings.json"

class GalleryHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/rate':
            self.handle_rate()
        elif self.path == '/api/score':
            self.handle_score()
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        if self.path.startswith('/api/scores'):
            self.handle_get_scores()
        else:
            super().do_GET()

    def handle_rate(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if 'gameId' not in data or 'rating' not in data:
                self.send_error(400, "Missing gameId or rating")
                return

            entry = {
                'gameId': data['gameId'],
                'rating': data['rating'],
                'timestamp': datetime.now().isoformat()
            }
            
            self.append_json("ratings.json", entry)
            self.send_json_response({"status": "success"})
            
        except Exception as e:
            self.send_error(500, str(e))

    def handle_score(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if 'gameId' not in data or 'name' not in data or 'score' not in data:
                self.send_error(400, "Missing fields")
                return

            leaderboards = self.load_json("leaderboards.json")
            game_id = data['gameId']
            
            if game_id not in leaderboards:
                leaderboards[game_id] = []
            
            leaderboards[game_id].append({
                'name': data['name'],
                'score': int(data['score']),
                'date': datetime.now().isoformat()
            })
            
            # Sort and Trim (Top 5)
            # Assuming higher score is better. If golf, need flag?
            # Default to high score for now.
            leaderboards[game_id].sort(key=lambda x: x['score'], reverse=True)
            leaderboards[game_id] = leaderboards[game_id][:5]
            
            self.save_json("leaderboards.json", leaderboards)
            self.send_json_response({"status": "success", "leaderboard": leaderboards[game_id]})
            
        except Exception as e:
            self.send_error(500, str(e))

    def handle_get_scores(self):
        try:
            from urllib.parse import urlparse, parse_qs
            query = parse_qs(urlparse(self.path).query)
            game_id = query.get('gameId', [None])[0]
            
            if not game_id:
                self.send_error(400, "Missing gameId")
                return

            leaderboards = self.load_json("leaderboards.json")
            scores = leaderboards.get(game_id, [])
            
            self.send_json_response(scores)
            
        except Exception as e:
            self.send_error(500, str(e))

    # Utilities
    def load_json(self, filename):
        if not os.path.exists(filename): return {} if 'leaderboard' in filename else []
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except:
            return {} if 'leaderboard' in filename else []

    def save_json(self, filename, data):
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)

    def append_json(self, filename, entry):
        data = self.load_json(filename)
        if isinstance(data, dict): data = [] # Should be list for ratings
        data.append(entry)
        self.save_json(filename, data)

    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

print(f"Starting Gallery Server on port {PORT}...")
print(f"Open http://localhost:{PORT} in your browser.")
print("Press Ctrl+C to stop.")

with socketserver.TCPServer(("", PORT), GalleryHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()
