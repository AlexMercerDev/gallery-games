export class GalleryManager {
    constructor() {
        this.games = [];
        this.currentGame = null;
    }

    async init() {
        await this.fetchGames();
        this.selectDailyGame();
        this.updateUI();
    }

    async fetchGames() {
        // Hardcoded list for static deployment (Vercel)
        this.games = [
            { id: 'puff-merge', name: 'Puff Merge', path: 'games/puff-merge/index.html', description: 'Cute physics merge game!' },
            { id: 'cloud-hop', name: 'Cloud Hop', path: 'games/cloud-hop/index.html', description: 'Endless vertical jumping.' },
            { id: 'puff-rush', name: 'Puff Rush', path: 'games/puff-rush/index.html', description: 'Endless running fun.' },
            { id: 'puff-putt', name: 'Puff Putt', path: 'games/puff-putt/index.html', description: 'Procedural mini-golf.' },
            { id: 'puff-shield', name: 'Puff Shield', path: 'games/puff-shield/index.html', description: 'Radial defense reflex game.' },
            { id: 'puff-snake', name: 'Puff Snake', path: 'games/puff-snake/index.html', description: 'Smooth physics snake.' },
            { id: 'puff-stack', name: 'Puff Stack', path: 'games/puff-stack/index.html', description: 'Minimalist block stacking.' },
            { id: 'puff-orbit', name: 'Puff Orbit', path: 'games/puff-orbit/index.html', description: 'Gravity-based planet hopping.' },
            { id: 'puff-swing', name: 'Puff Swing', path: 'games/puff-swing/index.html', description: 'Momentum-based swinging.' }
        ];
        console.log("Static Game List Loaded:", this.games);
    }

    selectDailyGame() {
        if (this.games.length === 0) return;

        // Seed RNG with Date String (YYYY-MM-DD)
        const dateStr = new Date().toISOString().split('T')[0];
        const seed = this.cyrb128(dateStr);
        const rand = this.sfc32(seed[0], seed[1], seed[2], seed[3]);

        const index = Math.floor(rand() * this.games.length);
        this.currentGame = this.games[index];

        console.log(`Daily Game for ${dateStr}: ${this.currentGame.name}`);
    }

    updateUI() {
        if (!this.currentGame) return;

        // Update Title
        document.getElementById('game-title').innerText = this.currentGame.name;
        document.getElementById('play-btn').href = this.currentGame.path;

        // Load Rating
        this.renderRating();

        // Load Leaderboard
        this.renderLeaderboard();
    }

    // Rating System
    // Rating System
    submitRating(rating) {
        if (!this.currentGame) return;
        const gameId = this.currentGame.id;
        const key = `gallery_rating_${gameId}`;
        localStorage.setItem(key, rating);
        console.log(`Rating ${rating} saved for ${gameId} to localStorage.`);
        this.renderRating();
    }

    getRating() {
        if (!this.currentGame) return 0;
        return parseInt(localStorage.getItem(`gallery_rating_${this.currentGame.id}`)) || 0;
    }

    renderRating() {
        const rating = this.getRating();
        const container = document.getElementById('rating-container');
        container.innerHTML = '';

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.innerText = '★';
            star.style.cursor = 'pointer';
            star.style.fontSize = '2rem';
            star.style.color = i <= rating ? '#FFD700' : '#444'; // Gold vs Gray
            star.onclick = () => this.submitRating(i);
            container.appendChild(star);
        }

        const label = document.createElement('div');
        label.innerText = rating > 0 ? `You rated: ${rating}/5` : "Rate this game!";
        label.style.fontSize = '0.8rem';
        label.style.marginTop = '5px';
        label.style.opacity = '0.7';
        container.appendChild(label);
    }

    renderLeaderboard() {
        if (!this.currentGame) return;
        const container = document.getElementById('leaderboard-container');
        if (!container) return;
        
        container.innerHTML = '';
        const key = `${this.currentGame.id}-leaderboard`;
        let localLb = [];
        try { 
            localLb = JSON.parse(localStorage.getItem(key) || '[]'); 
        } catch (e) { 
            console.error("Local Leaderboard Error:", e);
        }
        this.displayLeaderboard(localLb, container);
    }

    displayLeaderboard(leaderboard, container) {
        container.innerHTML = '';
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<p style="color: #555; font-style: italic;">No highscores yet.</p>';
            return;
        }

        const title = document.createElement('h4');
        title.innerText = "Top Players";
        title.style.margin = "0 0 10px 0";
        title.style.color = "#333";
        title.style.fontFamily = "Inter, sans-serif";
        container.appendChild(title);

        const list = document.createElement('ul');
        list.style.listStyle = "none";
        list.style.padding = "0";
        list.style.margin = "0";
        list.style.textAlign = "left";
        list.style.width = "100%";

        leaderboard.slice(0, 5).forEach((entry, index) => {
            const li = document.createElement('li');
            li.style.padding = "5px 0";
            li.style.borderBottom = "1px solid rgba(0,0,0,0.1)";
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.fontSize = "0.9rem";
            li.style.fontFamily = "Inter, sans-serif";

            const nameSpan = document.createElement('span');
            nameSpan.innerText = `${index + 1}. ${entry.name || 'Anon'}`;
            nameSpan.style.fontWeight = index === 0 ? "bold" : "normal";
            nameSpan.style.color = index === 0 ? "#E65100" : "#333"; // Deep Orange for #1

            const scoreSpan = document.createElement('span');
            scoreSpan.innerText = entry.score;
            scoreSpan.style.fontWeight = "bold";
            scoreSpan.style.color = "#333";

            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            list.appendChild(li);
        });

        container.appendChild(list);
    }

    // --- RNG Utilities (Seeded Random) ---
    cyrb128(str) {
        let h1 = 1779033703, h2 = 3144134277,
            h3 = 1013904242, h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
    }

    sfc32(a, b, c, d) {
        return function () {
            a |= 0; b |= 0; c |= 0; d |= 0;
            let t = (a + b | 0) + d | 0;
            d = d + 1 | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = (c << 21 | c >>> 11);
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        }
    }
}
