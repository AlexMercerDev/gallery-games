import http.server
import socketserver
import json
import os
from datetime import datetime, timedelta

PORT = 8000
RATINGS_FILE = "ratings.json"
LEADERBOARD_FILE = "leaderboards.json"

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
            
            ratings = self.load_json(RATINGS_FILE, is_list=True)
            ratings.append(entry)
            self.save_json(RATINGS_FILE, ratings)
            
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

            game_id = data['gameId']
            name = data['name']
            score = int(data['score'])
            now = datetime.now()
            
            # Leaderboard structure:
            # {
            #   "game_id": {
            #     "all_time": [...],
            #     "weekly": { "year_week": [...] }
            #   }
            # }
            leaderboards = self.load_json(LEADERBOARD_FILE, is_list=False)
            
            if game_id not in leaderboards:
                leaderboards[game_id] = {"all_time": [], "weekly": {}}
            
            entry = {
                'name': name,
                'score': score,
                'date': now.isoformat()
            }
            
            # 1. Update All-Time
            leaderboards[game_id]["all_time"].append(entry)
            leaderboards[game_id]["all_time"].sort(key=lambda x: x['score'], reverse=True)
            leaderboards[game_id]["all_time"] = leaderboards[game_id]["all_time"][:10]
            
            # 2. Update Weekly
            year_week = now.strftime("%Y-W%W") # e.g. 2026-W09
            if year_week not in leaderboards[game_id]["weekly"]:
                leaderboards[game_id]["weekly"][year_week] = []
            
            leaderboards[game_id]["weekly"][year_week].append(entry)
            leaderboards[game_id]["weekly"][year_week].sort(key=lambda x: x['score'], reverse=True)
            leaderboards[game_id]["weekly"][year_week] = leaderboards[game_id]["weekly"][year_week][:10]
            
            # Cleanup old weeks (keep last 4 weeks)
            weeks = sorted(leaderboards[game_id]["weekly"].keys(), reverse=True)
            if len(weeks) > 4:
                for old_week in weeks[4:]:
                    del leaderboards[game_id]["weekly"][old_week]

            self.save_json(LEADERBOARD_FILE, leaderboards)
            self.send_json_response({"status": "success", "all_time": leaderboards[game_id]["all_time"]})
            
        except Exception as e:
            self.send_error(500, str(e))

    def handle_get_scores(self):
        try:
            from urllib.parse import urlparse, parse_qs
            query = parse_qs(urlparse(self.path).query)
            game_id = query.get('gameId', [None])[0]
            scope = query.get('scope', ['all_time'])[0] # 'all_time' or 'weekly'
            
            if not game_id:
                self.send_error(400, "Missing gameId")
                return

            leaderboards = self.load_json(LEADERBOARD_FILE, is_list=False)
            game_data = leaderboards.get(game_id, {"all_time": [], "weekly": {}})
            
            if scope == 'weekly':
                year_week = datetime.now().strftime("%Y-W%W")
                scores = game_data["weekly"].get(year_week, [])
            else:
                scores = game_data["all_time"]
            
            self.send_json_response(scores)
            
        except Exception as e:
            self.send_error(500, str(e))

    # Utilities
    def load_json(self, filename, is_list=False):
        if not os.path.exists(filename):
            return [] if is_list else {}
        try:
            with open(filename, 'r') as f:
                content = f.read().strip()
                if not content:
                    return [] if is_list else {}
                return json.loads(content)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return [] if is_list else {}

    def save_json(self, filename, data):
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)

    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

print(f"Starting Gallery Backend (Weekly Persistence) on port {PORT}...")

with socketserver.TCPServer(("", PORT), GalleryHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()
