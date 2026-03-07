export class HopEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.score = 0;
        this.highscore = parseInt(localStorage.getItem('cloud-hop-highscore')) || 0;
        this.isGameOver = false;

        // Physics Constants
        this.gravity = 0.4;
        this.bounceForce = -12;
        this.moveSpeed = 0.5; // Horizontal smooth factor

        // Entities
        this.player = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 15,
            color: '#FFB7B2',
            face: 'OwO'
        };

        this.platforms = [];
        this.collectibles = [];
        this.particles = [];
        this.cameraY = 0;

        // Input
        this.inputX = 0; // Target X from mouse/touch

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input Listeners
        const updateInput = (x) => {
            this.inputX = x;
        };

        canvas.addEventListener('mousemove', e => updateInput(e.clientX));
        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            updateInput(e.touches[0].clientX);
        }, { passive: false });

        // Click to restart
        canvas.addEventListener('mousedown', () => this.tryRestart());
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.tryRestart();
        }, { passive: false });

        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Constrain width for consistency (Max 600px)
        // This ensures the "reachability" is consistent for all players
        const MAX_GAME_WIDTH = 600;
        if (this.canvas.width > MAX_GAME_WIDTH) {
            const margin = (this.canvas.width - MAX_GAME_WIDTH) / 2;
            this.wallL = margin;
            this.wallR = this.canvas.width - margin;
        } else {
            this.wallL = 0;
            this.wallR = this.canvas.width;
        }
    }

    // Simple manual LCG seeded random
    random() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;

        // Reset Seed for consistent levels
        this.seed = 12345; // Fixed seed for global competition

        // Player Start
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 200;
        this.player.vx = 0;
        this.player.vy = this.bounceForce; // Start with a jump

        this.cameraY = 0;
        this.inputX = this.canvas.width / 2;

        // Initial Platforms
        this.platforms = [];
        this.collectibles = [];
        this.particles = [];

        // Base platform
        // Center of the playable area
        const centerX = (this.wallL + this.wallR) / 2;
        this.platforms.push({ x: centerX, y: this.canvas.height - 50, w: 100, type: 'normal' });

        // Generate some starter platforms
        for (let i = 1; i < 10; i++) {
            this.spawnPlatform(this.canvas.height - 50 - (i * 100));
        }
    }

    spawnPlatform(y) {
        const typeRoll = this.random();
        let type = 'normal';
        let w = 80;

        if (this.score > 500 && typeRoll > 0.8) {
            type = 'moving';
            w = 70;
        } else if (this.score > 1000 && typeRoll > 0.9) {
            type = 'fragile'; // Breaks on jump
            w = 60;
        }

        // Generate X within the walls
        // Ensure new platform is within "reachable" horizontal distance?
        // For now, just spawning within walls is consistent enough with 600px width.
        const headerW = this.wallR - this.wallL;
        const xRel = this.random() * (headerW - w);
        const x = this.wallL + xRel + w / 2; // Center X

        const platform = {
            x: x,
            y: y,
            w: w,
            type: type,
            vx: type === 'moving' ? (this.random() > 0.5 ? 2 : -2) : 0
        };

        this.platforms.push(platform);

        // Spawn Collectible (Star)
        if (this.random() > 0.7 && type !== 'fragile') {
            this.collectibles.push({
                x: platform.x,
                y: platform.y - 40,
                radius: 10,
                baseY: platform.y - 40,
                offset: this.random() * Math.PI * 2
            });
        }
    }

    spawnParticles(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color: color
            });
        }
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

        // --- Player Physics ---
        this.player.vy += this.gravity;
        this.player.y += this.player.vy;

        // Horizontal Movement (Smooth lerp towards input)
        // Simple P control: vx = (target - current) * speed
        const dx = this.inputX - this.player.x;
        this.player.x += dx * 0.1;

        // Wall Bounce
        if (this.player.x - this.player.radius < this.wallL) {
            this.player.x = this.wallL + this.player.radius;
            this.player.vx *= -0.5;
        }
        if (this.player.x + this.player.radius > this.wallR) {
            this.player.x = this.wallR - this.player.radius;
        }

        // --- Platforms & Collectibles ---
        // Platform movement
        for (let p of this.platforms) {
            if (p.type === 'moving') {
                p.x += p.vx;
                if (p.x < p.w / 2 + this.wallL || p.x > this.wallR - p.w / 2) {
                    p.vx *= -1;
                }
            }
        }

        // Star Animation & Collision
        const time = Date.now() * 0.005;
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            let c = this.collectibles[i];
            c.y = c.baseY + Math.sin(time + c.offset) * 5;

            // Player collision with Star
            const dx = this.player.x - c.x;
            const dy = this.player.y - c.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + c.radius) {
                // Collected!
                this.score += 50;
                this.spawnParticles(c.x, c.y, '#FFD700', 10);
                this.collectibles.splice(i, 1);
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // --- Collision ---
        // Only bounce if falling
        if (this.player.vy > 0) {
            for (let i = this.platforms.length - 1; i >= 0; i--) {
                let p = this.platforms[i];
                // Check AABB/Circle-ish overlap
                if (this.player.y + this.player.radius > p.y &&
                    this.player.y + this.player.radius < p.y + 20 && // Tolerance
                    this.player.x > p.x - p.w / 2 &&
                    this.player.x < p.x + p.w / 2) {

                    // Bounce!
                    this.player.vy = this.bounceForce;
                    this.spawnParticles(this.player.x, this.player.y + this.player.radius, '#FFFFFF', 5);

                    if (p.type === 'fragile') {
                        // Break platform
                        this.spawnParticles(p.x, p.y, '#B0BEC5', 8);
                        this.platforms.splice(i, 1);
                    }
                }
            }
        }

        // --- Camera / Infinite Scroll ---
        // If player goes high (y decreases), move camera up (increase cameraY basically)
        // We want player to stay around 1/2 or 2/3 screen height
        const targetNavY = this.canvas.height * 0.6;
        if (this.player.y < this.cameraY + targetNavY) {
            const diff = (this.cameraY + targetNavY) - this.player.y;
            this.cameraY -= diff; // Move camera up (technically Y coords decrease as we go up, so subtract?)
            // Wait, screen Y is 0 at top. Player Y decreases as he goes up.
            // If PlayerY=100, and we want him at 400. We need to shift world down by 300.
            // Actually usually we just track a "score/height" variable and render relative to it.
        }

        // Simple Camera Logic:
        // Everything is rendered at y - cameraY ? 
        // Let's say absolute height grows.
        // Let's keep it simple: Player Y decreases. Platforms have fixed Y.
        // When player passes a threshold, we move all platforms down? Or just change a ViewOffset?
        // Let's use ViewOffset (this.cameraY).

        if (this.player.y < this.canvas.height / 2) {
            const shift = this.canvas.height / 2 - this.player.y;
            this.player.y += shift;
            this.score += Math.floor(shift);

            // Move Clouds/Stars/Particles Down
            for (let p of this.platforms) p.y += shift;
            for (let c of this.collectibles) { c.y += shift; c.baseY += shift; }
            for (let p of this.particles) p.y += shift;

            // Cull
            this.platforms = this.platforms.filter(p => p.y < this.canvas.height + 50);
            this.collectibles = this.collectibles.filter(c => c.y < this.canvas.height + 50);

            // Add new if top one is too low
            const highestObj = this.platforms.reduce((min, p) => p.y < min ? p.y : min, this.canvas.height);
            if (highestObj > 100) {
                this.spawnPlatform(highestObj - 100);
            }
        }

        // --- Game Over ---
        if (this.player.y > this.canvas.height + 100) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false; // Stop the loop so we don't stack loops on restart

        // Check if Highscore (Top 5)
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('cloud-hop-leaderboard') || '[]');
        } catch (e) { }

        // If leaderboard has less than 5 entries, or we beat the last one
        let isNewRecord = false;
        if (leaderboard.length < 5 || this.score > leaderboard[leaderboard.length - 1].score) {
            isNewRecord = true;
        }

        // Callback to UI
        if (this.onGameOver) {
            this.onGameOver(this.score, isNewRecord);
        }
    }

    saveHighscore(name) {
        // Load existing leaderboard
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('cloud-hop-leaderboard') || '[]');
        } catch (e) { }

        // Add new entry
        leaderboard.push({ name: name, score: this.score, date: new Date().toISOString() });

        // Sort and Keep Top 5
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);

        // Save back
        localStorage.setItem('cloud-hop-leaderboard', JSON.stringify(leaderboard));

        // Also update the single "best" for backward compatibility if needed
        this.highscore = leaderboard[0].score;
        localStorage.setItem('cloud-hop-highscore', this.highscore);
    }



    render() {
        // Gradient Sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#B2EBF2'); // Light Cyan
        gradient.addColorStop(1, '#FFCCBC'); // Deep Orange/Pink ish
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Play Area Borders (if wide screen)
        if (this.wallL > 0) {
            this.ctx.fillStyle = '#E0F7FA'; // Sidebar color
            this.ctx.fillRect(0, 0, this.wallL, this.canvas.height);
            this.ctx.fillRect(this.wallR, 0, this.canvas.width - this.wallR, this.canvas.height);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.wallL, 0); this.ctx.lineTo(this.wallL, this.canvas.height);
            this.ctx.moveTo(this.wallR, 0); this.ctx.lineTo(this.wallR, this.canvas.height);
            this.ctx.stroke();
        }

        // Platforms
        for (let p of this.platforms) {
            this.ctx.fillStyle = p.type === 'normal' ? 'rgba(255, 255, 255, 0.8)' :
                p.type === 'moving' ? 'rgba(255, 235, 59, 0.8)' : // Yellow tint
                    'rgba(224, 247, 250, 0.5)'; // Ghostly

            this.ctx.beginPath();
            this.roundRect(p.x - p.w / 2, p.y, p.w, 15, 10);
            this.ctx.fill();
        }

        // Collectibles
        this.ctx.fillStyle = '#FFD700'; // Gold
        for (let c of this.collectibles) {
            this.ctx.beginPath();
            this.drawStar(c.x, c.y, 5, c.radius, c.radius / 2);
            this.ctx.fill();
        }

        // Particles
        for (let p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;

        // Player
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Face
        this.ctx.fillStyle = '#6B5B5B';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.player.face, this.player.x, this.player.y);

        // Score
        this.ctx.fillStyle = '#6B5B5B';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.score, 20, 50);


        if (this.isGameOver) {
            // Darken
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    roundRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r);
        this.ctx.arcTo(x, y + h, x, y, r);
        this.ctx.arcTo(x, y, x + w, y, r);
        this.ctx.closePath();
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
    }
}
