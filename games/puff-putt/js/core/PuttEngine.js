export class PuttEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.holesCleared = 0;
        this.shotsLeft = 10;
        this.isGameOver = false;

        // Physics
        this.gravity = 0.4;
        this.friction = 0.98;
        this.groundFriction = 0.96;
        this.wallBounciness = 0.7;

        // Camera
        this.camera = { x: 0, y: 0 };

        // Ball
        this.ball = {
            x: 0, y: 0,
            vx: 0, vy: 0,
            radius: 12,
            isMoving: false,
            inHole: false,
            face: '>_<'
        };

        // Input (Aiming)
        this.drag = {
            active: false,
            startX: 0, startY: 0,
            currX: 0, currY: 0
        };

        // Level
        this.terrain = []; // Array of line segments? Or rectangles? Let's use Rects for simplicity first.
        this.holeObj = { x: 0, y: 0, radius: 20 };
        this.startPlatform = { x: 0, y: 0, w: 0 };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        canvas.addEventListener('mousedown', e => this.onDown(e));
        document.addEventListener('mousemove', e => this.onMove(e));
        document.addEventListener('mouseup', e => this.onUp(e));

        canvas.addEventListener('touchstart', e => { e.preventDefault(); this.onDown(e.touches[0]); }, { passive: false });
        document.addEventListener('touchmove', e => { if (this.drag.active) { e.preventDefault(); this.onMove(e.touches[0]); } }, { passive: false });
        document.addEventListener('touchend', e => { if (this.drag.active) { e.preventDefault(); this.onUp(null); } }, { passive: false });

        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    reset() {
        this.holesCleared = 0;
        this.shotsLeft = 10;
        this.isGameOver = false;
        this.generateLevel();
    }

    generateLevel() {
        // Reset Ball
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.isMoving = false;
        this.ball.inHole = false;

        // 1. Generate Start Platform (At left)
        this.terrain = [];

        const startY = this.canvas.height - 150;
        this.startPlatform = { x: 100, y: startY, w: 200, type: 'ground' };
        this.terrain.push(this.startPlatform);

        this.ball.x = 150;
        this.ball.y = startY - 20;

        // Reset Camera
        this.camera.x = 0;

        // 2. Generate Gap/Middle
        // Random Distance: 400 to 800
        const dist = 400 + Math.random() * 400;
        // Obstacles?
        if (Math.random() > 0.5) {
            this.terrain.push({
                x: 350, y: startY - 50 - Math.random() * 100,
                w: 50, h: 200, type: 'obstacle'
            });
        }

        // 3. Generate Hole Platform
        const holeY = startY + (Math.random() * 200 - 100); // +/- height
        this.terrain.push({ x: 100 + dist, y: holeY, w: 300, type: 'ground' });

        this.holeObj = { x: 100 + dist + 150, y: holeY, radius: 15 };

        // Add walls?
        // Floor death zone
    }

    onDown(e) {
        if (this.isGameOver || this.ball.isMoving) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;

        // Check if clicking near ball (in screen space)
        const screenBallX = this.ball.x - this.camera.x;
        const screenBallY = this.ball.y; // Camera only pans X?

        const dx = x - screenBallX;
        const dy = y - screenBallY;

        if (dx * dx + dy * dy < 100 * 100) { // Generous hit area
            this.drag.active = true;
            this.drag.startX = x;
            this.drag.startY = y;
            this.drag.currX = x;
            this.drag.currY = y;
        }
    }

    onMove(e) {
        if (!this.drag.active) return;
        const rect = this.canvas.getBoundingClientRect();
        this.drag.currX = (e.clientX || e.pageX) - rect.left;
        this.drag.currY = (e.clientY || e.pageY) - rect.top;
    }

    onUp(e) {
        if (!this.drag.active) return;
        this.drag.active = false;

        // Calculate Impulse
        const dx = this.drag.startX - this.drag.currX;
        const dy = this.drag.startY - this.drag.currY;

        const power = Math.sqrt(dx * dx + dy * dy);
        if (power > 10) { // Min pull
            const force = Math.min(power, 200) * 0.15; // Cap power
            const angle = Math.atan2(dy, dx);

            this.ball.vx = Math.cos(angle) * force;
            this.ball.vy = Math.sin(angle) * force;
            this.ball.isMoving = true;

            this.shotsLeft--;
            if (this.shotsLeft < 0) this.shotsLeft = 0; // Cap
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

        // Physics
        if (this.ball.isMoving) {
            this.ball.vy += this.gravity;
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;

            // Collision with Terrain (Rects)
            let onGround = false;

            for (let t of this.terrain) {
                // Simple AABB for now, Ball Point vs Rect
                // Top Surface
                if (this.ball.x >= t.x && this.ball.x <= t.x + t.w) {
                    // Check Y
                    // Ground (type 'ground' is a floor segment, assume flat line at y)
                    if (t.type === 'ground') {
                        // Check if hitting top
                        if (this.ball.y + this.ball.radius > t.y && this.ball.y - this.ball.radius < t.y + 20) {
                            // Hit
                            if (this.ball.vy > 0) { // Falling onto it
                                this.ball.y = t.y - this.ball.radius;
                                this.ball.vy *= -this.wallBounciness; // Bounce
                                // Friction
                                this.ball.vx *= this.groundFriction;
                                if (Math.abs(this.ball.vy) < 1) {
                                    this.ball.vy = 0;
                                    onGround = true;
                                }
                            }
                        }
                    } else if (t.type === 'obstacle') {
                        // Rect collision
                        // Check bounds
                        if (this.ball.y + this.ball.radius > t.y && this.ball.y - this.ball.radius < t.y + t.h) {
                            if (this.ball.x + this.ball.radius > t.x && this.ball.x - this.ball.radius < t.x + t.w) {
                                // Determine side
                                // Lazy: just bounce X
                                this.ball.vx *= -this.wallBounciness;
                                // Push out?
                            }
                        }
                    }
                }
            }

            // Stop Condition
            if (onGround && Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1) {
                this.ball.isMoving = false;
                this.ball.vx = 0;
                this.ball.vy = 0;
                this.checkTurnEnd();
            }

            // Death Check (Fell off world)
            if (this.ball.y > this.canvas.height + 100) {
                // Return to start of level?
                this.ball.isMoving = false;
                this.ball.vx = 0;
                this.ball.vy = 0;
                // Reset position to last safe spot? For now, start of level.
                // Or just end turn.
                // Penalty?
                // Let's reset to startPlatform center
                this.ball.x = this.startPlatform.x + 50;
                this.ball.y = this.startPlatform.y - 50;

                this.checkTurnEnd();
            }

            // Hole Check
            const dx = this.ball.x - this.holeObj.x;
            const dy = this.ball.y - this.holeObj.y; // Hole is usually flush with ground
            // Check if close X and rolling slowly
            if (Math.abs(dx) < 10 && Math.abs(dy) < 15 && Math.abs(this.ball.vx) < 5) {
                this.holeIn();
            }
        }

        // Camera Follow
        // Target: Ball X - Offset
        const targetCamX = this.ball.x - this.canvas.width * 0.2;
        this.camera.x += (targetCamX - this.camera.x) * 0.1;
    }

    checkTurnEnd() {
        if (this.shotsLeft <= 0 && !this.ball.inHole) {
            this.triggerGameOver();
        }
    }

    holeIn() {
        if (this.ball.inHole) return;
        this.ball.inHole = true;
        this.ball.isMoving = false;

        // Rewards
        // Need to calculate Par?
        this.shotsLeft += 3; // FIX: Increased reward from 2 to 3 to make it easier
        this.holesCleared++;

        // Next Level
        setTimeout(() => this.generateLevel(), 1000);
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;

        // Leaderboard
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-putt-leaderboard') || '[]');
        } catch (e) { }

        let isNew = false;
        if (leaderboard.length < 5 || this.holesCleared > leaderboard[leaderboard.length - 1].score) {
            isNew = true;
        }

        if (this.onGameOver) this.onGameOver(this.holesCleared, isNew, leaderboard);
    }

    saveHighscore(name) {
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-putt-leaderboard') || '[]');
        } catch (e) { }
        leaderboard.push({ name: name, score: this.holesCleared, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('puff-putt-leaderboard', JSON.stringify(leaderboard));
    }

    render() {
        // Clear
        this.ctx.fillStyle = '#E0F7FA';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y); // Vertical cam? No, just X for now.

        // Terrain
        this.ctx.fillStyle = '#81C784'; // Grass Green
        for (let t of this.terrain) {
            if (t.type === 'ground') {
                this.ctx.fillRect(t.x, t.y, t.w, 400); // Deep earth
                // Top line
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.fillRect(t.x, t.y, t.w, 10);
                this.ctx.fillStyle = '#81C784';
            } else if (t.type === 'obstacle') {
                this.ctx.fillStyle = '#795548'; // Wood/Rock
                this.ctx.fillRect(t.x, t.y, t.w, t.h);
                this.ctx.fillStyle = '#81C784';
            }
        }

        // Hole
        this.ctx.fillStyle = '#3E2723';
        this.ctx.beginPath();
        this.ctx.arc(this.holeObj.x, this.holeObj.y, this.holeObj.radius, 0, Math.PI, false); // Semicircle cup
        this.ctx.fill();

        // Flag
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.holeObj.x, this.holeObj.y);
        this.ctx.lineTo(this.holeObj.x, this.holeObj.y - 60);
        this.ctx.stroke();
        this.ctx.fillStyle = '#F44336';
        this.ctx.beginPath();
        this.ctx.moveTo(this.holeObj.x, this.holeObj.y - 60);
        this.ctx.lineTo(this.holeObj.x + 20, this.holeObj.y - 50);
        this.ctx.lineTo(this.holeObj.x, this.holeObj.y - 40);
        this.ctx.fill();

        // Ball
        if (!this.ball.inHole) {
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Face
            this.ctx.fillStyle = '#333';
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.ball.face, this.ball.x, this.ball.y);
        }

        this.ctx.restore();

        // Aim Line (UI Layer)
        if (this.drag.active) {
            const screenBallX = this.ball.x - this.camera.x;
            const screenBallY = this.ball.y;

            // Calculate Force
            const dx = this.drag.startX - this.drag.currX;
            const dy = this.drag.startY - this.drag.currY;
            const power = Math.sqrt(dx * dx + dy * dy);
            const force = Math.min(power, 200) * 0.15;
            const angle = Math.atan2(dy, dx);
            const vx = Math.cos(angle) * force;
            const vy = Math.sin(angle) * force;

            // Draw Trajectory Prediction
            this.ctx.fillStyle = '#FF5722';
            let simX = screenBallX;
            let simY = screenBallY;
            let simVx = vx;
            let simVy = vy;

            for (let i = 0; i < 15; i++) { // Simulate 15 steps
                simVy += this.gravity;
                simX += simVx;
                simY += simVy;

                this.ctx.beginPath();
                this.ctx.arc(simX, simY, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Power circle
            this.ctx.beginPath();
            this.ctx.arc(screenBallX, screenBallY, 30, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            this.ctx.stroke();
        }

        // HUD
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#01579B';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.fillText(`Hole: ${this.holesCleared + 1}`, 20, 40);
        this.ctx.fillText(`Shots: ${this.shotsLeft}`, 20, 70);
    }
}
