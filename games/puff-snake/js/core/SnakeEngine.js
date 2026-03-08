export class SnakeEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.hasStarted = false;
        this.score = 0;
        this.isGameOver = false;

        // Entities
        this.head = { x: 0, y: 0, radius: 15, angle: 0 };
        this.speed = 4;
        this.turnSpeed = 0.1;

        // Tail
        this.history = []; // Array of {x, y}
        this.tailLength = 5; // Initial segments
        this.segmentSpacing = 8; // History frames per segment (depends on speed)

        // Food
        this.food = { x: 0, y: 0, radius: 10, face: '^o^' };

        // Juice
        this.frame = 0;
        this.pulse = 0;
        this.particles = []; // { x, y, vx, vy, life, color, size }
        this.shake = 0;

        // Skins
        this.skins = [
            { name: 'Classic', head: '#689F38', body: ['#AED581', '#8BC34A'] },
            { name: 'Blue', head: '#1E88E5', body: ['#64B5F6', '#42A5F5'] },
            { name: 'Purple', head: '#8E24AA', body: ['#BA68C8', '#AB47BC'] },
            { name: 'Orange', head: '#F57C00', body: ['#FFB74D', '#FF9800'] },
            { name: 'Pink', head: '#C2185B', body: ['#F48FB1', '#EC407A'] },
            { name: 'Mint', head: '#00897B', body: ['#4DB6AC', '#26A69A'] }
        ];
        this.currentSkin = parseInt(localStorage.getItem('puff-snake-skin')) || 0;

        // Input
        this.input = { x: 0, y: 0, active: false };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        document.addEventListener('mousemove', e => this.onMove(e));
        document.addEventListener('touchmove', e => { e.preventDefault(); this.onMove(e.touches[0]); }, { passive: false });

        // Click to start
        canvas.addEventListener('mousedown', () => this.initStart());
        canvas.addEventListener('touchstart', () => this.initStart());

        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Logic to keep game playable on wide screens?
        // For snake, full screen is fine, but maybe limit spawn area if too wide?
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;
        this.hasStarted = false;

        this.head.x = this.canvas.width / 2;
        this.head.y = this.canvas.height / 2;
        this.head.angle = -Math.PI / 2; // Up

        this.history = [];
        // Pre-fill history so tail exists
        for (let i = 0; i < 100; i++) {
            this.history.push({ x: this.head.x, y: this.head.y + i * this.speed });
        }

        this.tailLength = 5;
        this.spawnFood();

        this.input.x = this.head.x;
        this.input.y = this.head.y - 100; // Fake input up
    }

    initStart() {
        if (!this.hasStarted && !this.isGameOver) {
            this.hasStarted = true;
            if (this.onStart) this.onStart();
        }
    }

    spawnFood() {
        const margin = 50;
        this.food.x = margin + Math.random() * (this.canvas.width - margin * 2);
        this.food.y = margin + Math.random() * (this.canvas.height - margin * 2);
        // Ensure not on top of snake? (Simplified for now)
    }

    spawnParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: color,
                size: 3 + Math.random() * 5
            });
        }
    }

    onMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.input.x = (e.clientX || e.pageX) - rect.left;
        this.input.y = (e.clientY || e.pageY) - rect.top;
        this.input.active = true;

        if (!this.hasStarted && !this.isGameOver) {
            this.hasStarted = true;
            if (this.onStart) this.onStart();
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
        if (!this.hasStarted) return;

        this.frame++;
        this.pulse = Math.sin(this.frame * 0.1) * 2;

        // Juice Decay
        if (this.shake > 0) this.shake *= 0.9;

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.025;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // 1. Movement
        // Desired angle
        const dx = this.input.x - this.head.x;
        const dy = this.input.y - this.head.y;

        // Only turn if distance is somewhat far (prevent jitter)
        if (dx * dx + dy * dy > 20 * 20) {
            const targetAngle = Math.atan2(dy, dx);

            // Smooth turn towards angle
            let diff = targetAngle - this.head.angle;
            // Normalize -PI to PI
            while (diff <= -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            this.head.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed);
        }

        this.head.x += Math.cos(this.head.angle) * this.speed;
        this.head.y += Math.sin(this.head.angle) * this.speed;

        // 2. History
        this.history.unshift({ x: this.head.x, y: this.head.y });
        // Trim history
        const neededHistory = (this.tailLength + 1) * this.segmentSpacing;
        if (this.history.length > neededHistory) {
            this.history.length = neededHistory;
        }

        // 3. Collision
        // Wall
        if (this.head.x < this.head.radius || this.head.x > this.canvas.width - this.head.radius ||
            this.head.y < this.head.radius || this.head.y > this.canvas.height - this.head.radius) {
            this.triggerGameOver();
            return;
        }

        // Tail
        // Start checking from segment 5 to avoid detecting head/neck
        const safeZone = 20; // Index in history
        for (let i = safeZone; i < this.history.length; i += 5) { // Optimization: check every 5th frame
            const p = this.history[i];
            const distSq = (this.head.x - p.x) ** 2 + (this.head.y - p.y) ** 2;
            if (distSq < (this.head.radius * 1.5) ** 2) {
                this.triggerGameOver();
                return;
            }
        }

        // Food
        const distFood = (this.head.x - this.food.x) ** 2 + (this.head.y - this.food.y) ** 2;
        if (distFood < (this.head.radius + this.food.radius) ** 2) {
            // Eat
            this.score++;
            this.tailLength += 3;
            this.spawnFood();

            // Juice
            this.pulse = 5; // Pop effect
            this.spawnParticles(this.food.x, this.food.y, '#FF7043', 12);
            this.shake = 4;
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;

        // Leaderboard
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-snake-leaderboard') || '[]');
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
            leaderboard = JSON.parse(localStorage.getItem('puff-snake-leaderboard') || '[]');
        } catch (e) { }
        leaderboard.push({ name: name, score: this.score, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('puff-snake-leaderboard', JSON.stringify(leaderboard));
    }

    render() {
        // Trail background
        this.ctx.fillStyle = '#F0F4C3'; // Opaque clear (No trails)
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply Screen Shake
        this.ctx.save();
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Grid Pattern
        this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        this.ctx.lineWidth = 1;
        const cellSize = 50;
        // const offsetX = (this.frame * 0.5) % cellSize; // Scroll effect? No, static grid is better for reference.

        for (let x = 0; x < this.canvas.width; x += cellSize) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += cellSize) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
        }

        // Tail
        // Iterate segments
        const skinColors = this.skins[this.currentSkin].body;
        for (let i = this.tailLength; i > 0; i--) {
            const index = i * this.segmentSpacing;
            if (index < this.history.length) {
                const p = this.history[index];

                // Color gradient
                // Pulse size down the tail
                const size = 12 + Math.sin(this.frame * 0.2 + i * 0.5);

                this.ctx.fillStyle = i % 2 === 0 ? skinColors[0] : skinColors[1];

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Head
        this.ctx.save();
        this.ctx.translate(this.head.x, this.head.y);
        this.ctx.rotate(this.head.angle);

        // Pulse Head
        const headScale = 1 + (this.pulse / 20);
        this.ctx.scale(headScale, headScale);

        const skinHead = this.skins[this.currentSkin].head;
        this.ctx.fillStyle = skinHead;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.head.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Face
        // Eyes
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(5, -5, 4, 0, Math.PI * 2);
        this.ctx.arc(5, 5, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(7, -5, 2, 0, Math.PI * 2);
        this.ctx.arc(7, 5, 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();

        // Food
        this.ctx.save();
        this.ctx.translate(this.food.x, this.food.y);
        const foodPulse = 1 + Math.sin(this.frame * 0.1) * 0.1;
        this.ctx.scale(foodPulse, foodPulse);

        this.ctx.fillStyle = '#FF7043';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.food.radius, 0, Math.PI * 2);
        this.ctx.fill();
        // ... Face ...
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.food.face, 0, 0);

        this.ctx.restore();

        // Particles
        for (let p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;

        this.ctx.restore(); // End shake

        // Score
        this.ctx.fillStyle = '#33691E';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Puffs: ${this.score}`, 20, 40);
    }

    nextSkin() {
        this.currentSkin = (this.currentSkin + 1) % this.skins.length;
        localStorage.setItem('puff-snake-skin', this.currentSkin);
    }
}
