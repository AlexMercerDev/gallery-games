export class ShieldEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.score = 0;
        this.isGameOver = false;

        // Juice
        this.shake = 0;
        this.flash = 0;
        this.beat = 0; // Heartbeat for center

        // Settings
        this.centerRadius = 30;
        this.shieldRadius = 80;
        this.shieldArc = Math.PI / 2; // 90 degrees

        // Entities
        this.shieldAngle = -Math.PI / 2; // Pointing Up
        this.enemies = []; // { angle, dist, speed, type }

        // Spawner
        this.spawnRate = 120; // Frames
        this.spawnTimer = 0;
        this.difficultyTimer = 0;

        // Particles
        this.particles = [];

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        document.addEventListener('mousemove', e => this.onMove(e));
        document.addEventListener('touchmove', e => { e.preventDefault(); this.onMove(e.touches[0]); }, { passive: false });

        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;
        this.enemies = [];
        this.particles = [];
        this.spawnRate = 120;
        this.difficultyTimer = 0;
        this.shake = 0;
        this.flash = 0;
    }

    onMove(e) {
        if (this.isGameOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;

        const dx = x - this.centerX;
        const dy = y - this.centerY;

        this.shieldAngle = Math.atan2(dy, dx);
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

        // Juice Decay
        if (this.shake > 0) this.shake *= 0.9;
        if (this.flash > 0) this.flash *= 0.9;
        this.beat += 0.05;

        // Spawner
        this.spawnTimer++;
        if (this.spawnTimer > this.spawnRate) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        // Difficulty
        this.difficultyTimer++;
        if (this.difficultyTimer % 600 === 0) { // Every 10s
            this.spawnRate = Math.max(30, this.spawnRate - 10);
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            e.dist -= e.speed;

            // Collision Check

            // 1. Shield Check
            if (e.dist <= this.shieldRadius + 15 && e.dist >= this.shieldRadius - 15) { // Thicker collider
                // Check Angle
                let diff = Math.atan2(Math.sin(e.angle - this.shieldAngle), Math.cos(e.angle - this.shieldAngle));
                if (Math.abs(diff) < this.shieldArc / 2 + 0.2) { // Slightly forgiving arc
                    // Blocked!
                    this.enemies.splice(i, 1);
                    this.score++;

                    // FEEDBACK
                    this.spawnParticles(e.angle, this.shieldRadius, '#FFEA00'); // Gold sparks
                    this.shake = 10;
                    this.flash = 0.3;

                    continue;
                }
            }

            // 2. Center Check
            if (e.dist < this.centerRadius) {
                this.triggerGameOver();
                return;
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life--;
            p.x += p.vx;
            p.y += p.vy;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.canvas.width, this.canvas.height) / 2 + 50;
        const speed = 2 + Math.random() * 2 + (this.score / 50); // Speed up

        this.enemies.push({ angle, dist, speed, type: 0 });
    }

    spawnParticles(angle, dist, color) {
        const px = this.centerX + Math.cos(angle) * dist;
        const py = this.centerY + Math.sin(angle) * dist;

        for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = Math.random() * 5;
            this.particles.push({
                x: px, y: py,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 30,
                color: color
            });
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;

        // Leaderboard
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-shield-leaderboard') || '[]');
        } catch (e) { }

        let isNew = false;
        if (leaderboard.length < 5 || this.score > leaderboard[leaderboard.length - 1].score) {
            isNew = true;
        }

        if (this.onGameOver) this.onGameOver(this.score, isNew, leaderboard);
    }

    saveHighscore(name) {
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-shield-leaderboard') || '[]');
        } catch (e) { }
        leaderboard.push({ name: name, score: this.score, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('puff-shield-leaderboard', JSON.stringify(leaderboard));
    }

    render() {
        // Clear with slight trail is cool, but let's do clean clear + Flash
        this.ctx.fillStyle = '#120024';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Screen Shake Apply
        if (this.shake > 0.5) {
            const dx = (Math.random() - 0.5) * this.shake;
            const dy = (Math.random() - 0.5) * this.shake;
            this.ctx.translate(dx, dy);
        }

        const cx = this.centerX;
        const cy = this.centerY;

        // Pulse Effect (Background)
        const pulse = Math.sin(this.beat) * 10;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 200 + pulse, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.stroke();

        // Center Puff
        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Breathing animation
        const scale = 1 + Math.sin(this.beat) * 0.05;
        this.ctx.scale(scale, scale);

        // Glow
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = '#00B0FF';
        this.ctx.fillStyle = '#E1F5FE';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.centerRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Face (Sleeping)
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText("u_u", 0, 0);

        this.ctx.restore(); // Undo scale/translate

        // Shield
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.shieldAngle); // Rotate canvas to shield angle being 0

        // Draw Arc
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.shieldRadius, -this.shieldArc / 2, this.shieldArc / 2);
        this.ctx.strokeStyle = '#FFEA00';
        this.ctx.lineWidth = 10;
        this.ctx.lineCap = 'round';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#FFEA00';
        this.ctx.stroke();

        this.ctx.restore();

        // Enemies
        this.ctx.fillStyle = '#F44336'; // Red
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#F44336';
        for (let e of this.enemies) {
            const ex = cx + Math.cos(e.angle) * e.dist;
            const ey = cy + Math.sin(e.angle) * e.dist;

            this.ctx.beginPath();
            // Pointy triangle pointing to center
            this.ctx.moveTo(ex + Math.cos(e.angle) * 10, ey + Math.sin(e.angle) * 10); // Back
            // Actually, point is at -10 radius?
            // Simple circle for now
            this.ctx.arc(ex, ey, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;

        // Particles
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        // Score
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
    }
}
