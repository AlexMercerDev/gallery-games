export class RushEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.score = 0; // Distance
        this.coinScore = 0; // Bonus from coins
        this.highscore = 0; // Loaded later
        this.isGameOver = false;

        // Physics Constants
        this.gravity = 0.6;
        this.jumpForce = -12; // Higher jump
        this.glideGravity = 0.15; // Slightly heavier glide
        this.speed = 6; // Faster start

        // Player
        this.player = {
            x: 100, // Fixed X position
            y: 0,
            vy: 0,
            radius: 20,
            isGrounded: false,
            isGliding: false,
            color: '#F48FB1', // Pink
            face: '>_<'
        };

        this.input = {
            jumping: false
        };

        // World Sections
        this.segments = [];
        this.groundY = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input Listeners
        const jumpStart = (e) => {
            if (this.isGameOver) return;
            this.input.jumping = true;

            if (this.player.isGrounded) {
                this.player.vy = this.jumpForce;
                this.player.isGrounded = false;
                // Jump Particles?
            }
        };

        const jumpEnd = () => {
            this.input.jumping = false;
            // Cut jump short if released early? 
            if (this.player.vy < -5) {
                this.player.vy *= 0.5;
            }
        };

        canvas.addEventListener('mousedown', jumpStart);
        canvas.addEventListener('mouseup', jumpEnd);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jumpStart(); }, { passive: false });
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); jumpEnd(); }, { passive: false });

        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height - 100;
    }

    reset() {
        this.score = 0;
        this.coinScore = 0;
        this.speed = 6;
        this.isGameOver = false;

        this.player.y = this.groundY - 50;
        this.player.vy = 0;
        this.player.isGrounded = false;
        this.player.isGliding = false;

        // Reset Level
        this.segments = [];
        this.obstacles = []; // New
        this.coins = []; // New

        // Initial flat ground
        this.segments.push({
            x: 0,
            y: this.groundY,
            w: this.canvas.width * 2,
            type: 'ground'
        });
    }

    start() {
        this.isRunning = true;
        this.loop();
    }

    loop() {
        if (!this.isRunning) return;
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        if (this.isGameOver) return;

        // --- Physics ---
        if (this.input.jumping && !this.player.isGrounded && this.player.vy > 0) {
            this.player.isGliding = true;
            this.player.vy += this.glideGravity;
        } else {
            this.player.isGliding = false;
            this.player.vy += this.gravity;
        }

        this.player.y += this.player.vy;

        // --- Scrolling ---
        this.score += this.speed * 0.05; // Distance metric
        this.speed += 0.001; // Tiny acceleration

        // Move Segments
        for (let s of this.segments) {
            s.x -= this.speed;
        }

        // Cleanup Segments
        if (this.segments[0].x + this.segments[0].w < 0) {
            this.segments.shift();
        }

        // Generate New Segments
        const lastSeg = this.segments[this.segments.length - 1];
        if (lastSeg.x + lastSeg.w < this.canvas.width + 500) {
            this.spawnSegment(lastSeg.x + lastSeg.w);
        }

        // --- Collision ---
        this.checkCollision();
        this.checkEntityCollision(); // New check for obstacles/coins

        // Pit Death
        if (this.player.y > this.canvas.height + 50) {
            this.triggerGameOver();
        }
    }

    spawnSegment(startX) {
        // Randomly choose segment type
        const r = Math.random();
        let w = 400 + Math.random() * 400; // Random width

        // Gap Handling
        if (this.score > 200 && r > 0.7) { // Increased gap freq
            const gapSize = 120 + Math.random() * 80; // Larger gaps
            this.segments.push({ x: startX, y: this.canvas.height, w: gapSize, type: 'gap' });
            startX += gapSize;
        }

        const groundY = this.groundY; // Could vary
        this.segments.push({ x: startX, y: groundY, w: w, type: 'ground' });

        // Spawn Entities on this new ground
        // Don't spawn too close to the start or end (to allow landing/jumping)
        const safeMargin = 100;
        const spawnableWidth = w - (safeMargin * 2);

        if (spawnableWidth > 50) {
            // Coins
            if (Math.random() > 0.3) {
                const coinX = startX + safeMargin + Math.random() * spawnableWidth;
                const pattern = Math.random();

                if (pattern > 0.6) {
                    // Arc of coins
                    for (let i = 0; i < 5; i++) {
                        this.coins.push({
                            x: coinX + i * 40,
                            y: groundY - 100 - Math.sin(i / 4 * Math.PI) * 50,
                            radius: 10,
                            collected: false
                        });
                    }
                } else {
                    // Line of coins
                    this.coins.push({ x: coinX, y: groundY - 40, radius: 10, collected: false });
                    this.coins.push({ x: coinX + 40, y: groundY - 40, radius: 10, collected: false });
                }
            }

            // Obstacles
            if (this.score > 100 && Math.random() > 0.5) {
                const obsX = startX + safeMargin + Math.random() * spawnableWidth;
                this.obstacles.push({
                    x: obsX,
                    y: groundY - 20, // Sit on ground
                    w: 30,
                    h: 40,
                    type: Math.random() > 0.5 ? 'rock' : 'stump'
                });
            }
        }
    }

    checkCollision() {
        this.player.isGrounded = false;

        // Simple Floor Collision
        // Check if player is above any ground segment
        // Rect vs Circle (simplified to Rect vs Point at feet)
        const feetX = this.player.x;
        const feetY = this.player.y + this.player.radius;

        for (let s of this.segments) {
            if (s.type === 'ground') {
                if (feetX >= s.x && feetX <= s.x + s.w) {
                    // Above this segment
                    if (feetY >= s.y && feetY <= s.y + 20 && this.player.vy >= 0) {
                        // Landed
                        this.player.isGrounded = true;
                        this.player.y = s.y - this.player.radius;
                        this.player.vy = 0;
                    }
                }
            }
        }
    }

    checkEntityCollision() {
        // Move Entities
        for (let o of this.obstacles) o.x -= this.speed;
        for (let c of this.coins) c.x -= this.speed;

        // Cleanup
        this.obstacles = this.obstacles.filter(o => o.x > -100);
        this.coins = this.coins.filter(c => c.x > -100 && !c.collected);

        // Player Rect (Approx)
        const pL = this.player.x - this.player.radius + 5;
        const pR = this.player.x + this.player.radius - 5;
        const pT = this.player.y - this.player.radius + 5;
        const pB = this.player.y + this.player.radius - 5;

        // Obstacles
        for (let o of this.obstacles) {
            if (pR > o.x && pL < o.x + o.w && pB > o.y && pT < o.y + o.h) {
                // Hit!
                this.triggerGameOver();
                return;
            }
        }

        // Coins
        for (let c of this.coins) {
            if (!c.collected) {
                const dx = this.player.x - c.x;
                const dy = this.player.y - c.y;
                if (dx * dx + dy * dy < (this.player.radius + c.radius) * (this.player.radius + c.radius)) {
                    c.collected = true;
                    this.coinScore += 50; // Bonus points
                    // Particle effect?
                }
            }
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;

        // Leaderboard check
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-rush-leaderboard') || '[]');
        } catch (e) { }

        const finalScore = Math.floor(this.score) + this.coinScore;

        let isNew = false;
        if (leaderboard.length < 5 || finalScore > leaderboard[leaderboard.length - 1].score) {
            isNew = true;
        }

        if (this.onGameOver) this.onGameOver(finalScore, isNew, leaderboard);
    }

    saveHighscore(name) {
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-rush-leaderboard') || '[]');
        } catch (e) { }

        // Final Score = Dist + Coins
        const finalScore = Math.floor(this.score) + this.coinScore;

        leaderboard.push({ name: name, score: finalScore, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('puff-rush-leaderboard', JSON.stringify(leaderboard));
    }

    render() {
        // Sky
        this.ctx.fillStyle = '#B2EBF2';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Parallax Hills (Back)
        this.ctx.fillStyle = '#81D4FA'; // Darker Blue/Green
        // Scroll slower: score / 5
        let bgOffset = -(this.score * 5) % this.canvas.width;
        // Draw multiple to fill screen
        for (let i = 0; i < 3; i++) {
            let xOff = bgOffset + (i * 800);
            this.ctx.beginPath();
            this.ctx.arc(xOff, this.canvas.height, 400, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Segments (Ground)
        for (let s of this.segments) {
            if (s.type === 'ground') {
                this.ctx.fillStyle = '#66BB6A'; // Green
                this.ctx.fillRect(s.x, s.y, s.w, this.canvas.height - s.y);

                // Grass top
                this.ctx.fillStyle = '#43A047';
                this.ctx.fillRect(s.x, s.y, s.w, 20);
            }
        }

        // Obstacles
        this.ctx.fillStyle = '#795548'; // Brown
        for (let o of this.obstacles) {
            this.ctx.fillRect(o.x, o.y, o.w, o.h);
        }

        // Coins
        this.ctx.fillStyle = '#FFD700'; // Gold
        for (let c of this.coins) {
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
            this.ctx.fill();
            // Shine
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(c.x - 3, c.y - 3, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#FFD700';
        }

        // Player
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Face
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.player.face, this.player.x, this.player.y);

        // Umbrella (Glide visual)
        if (this.player.isGliding) {
            this.ctx.fillStyle = '#FFF176'; // Yellow
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y - 30, 25, Math.PI, 0); // Semi circle up
            this.ctx.fill();
            this.ctx.strokeStyle = '#555';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x, this.player.y - 30);
            this.ctx.lineTo(this.player.x, this.player.y - 10);
            this.ctx.stroke();
        }

        // UI
        this.ctx.fillStyle = '#555';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'left';
        const dist = Math.floor(this.score);
        this.ctx.fillText(`Run: ${dist}m  Coins: ${this.coinScore}`, 20, 40);

        // Tutorial
        if (this.score < 50) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("Tap to Jump", this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText("Hold to Glide", this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }
}
