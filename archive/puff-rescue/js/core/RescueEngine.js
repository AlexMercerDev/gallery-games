export class RescueEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.level = 1;
        this.score = 0;
        this.isGameOver = false;

        // Physics Consts
        this.gravity = 0.03; // Low gravity
        this.thrustPower = 0.08;
        this.rotateSpeed = 0.05;
        this.landingMaxSpeed = 0.8;
        this.landingMaxAngle = 0.3; // radians ~17 degrees

        // Player (Lander)
        this.player = {
            x: 0, y: 0,
            vx: 0, vy: 0,
            angle: 0,
            fuel: 100,
            width: 20,
            height: 20
        };

        // World
        this.terrain = []; // Array of points {x,y}
        this.landingPad = null; // {x, y, width}
        this.collectibles = []; // {x, y, active, radius}

        // Input
        this.keys = { left: false, right: false, thrust: false };

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        this.reset();
    }

    setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.key === 'd') this.keys.right = true;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') this.keys.thrust = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.key === 'd') this.keys.right = false;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') this.keys.thrust = false;
        });

        // Touch / Buttons
        const bindBtn = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
            btn.addEventListener('mousedown', (e) => { e.preventDefault(); this.keys[key] = true; });
            btn.addEventListener('mouseup', (e) => { e.preventDefault(); this.keys[key] = false; });
        };

        bindBtn('btn-left', 'left');
        bindBtn('btn-right', 'right');
        bindBtn('btn-thrust', 'thrust');

        // Canvas Touch as fallback (or remove?)
        // Let's keep canvas touch for "Tap anywhere to rotate" if buttons aren't hit, 
        // but buttons overlap canvas z-index, so they capture first.
        // Actually, let's remove general touch logic to avoid conflict with buttons.
        // Or keep it simple: Buttons ARE the touch controls.
    }

    handleTouch(touches) {
        // Deprecated in favor of UI buttons
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    reset() {
        this.isGameOver = false;
        document.getElementById('game-over').style.display = 'none';

        this.generateLevel();

        // Spawn Player Safe
        // Find a safe spot high above terrain but not too close to edges
        this.player.x = 100;
        this.player.y = 50; // Higher up

        // Ensure not inside a peak
        // check terrain height at 100
        // ... simple enough to just be high up

        this.player.vx = 2.0; // Stronger initial push to frame the level
        this.player.vy = 0;
        this.player.angle = Math.PI * 0.1;
        this.player.fuel = 100;
    }

    restart() {
        this.level = 1;
        this.score = 0;
        this.reset();
        this.start();
    }

    generateLevel() {
        this.terrain = [];
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Height map logic
        let hMap = h * 0.8;
        this.terrain.push({ x: 0, y: hMap });

        let padX = 200 + Math.random() * (w - 300);
        this.landingPad = { x: padX, y: 0, width: 80 };

        const step = 40;
        for (let x = 0; x <= w; x += step) {
            // Landing Pad Area
            if (x >= padX && x <= padX + 80) {
                // Flatten
                if (this.landingPad.y === 0) this.landingPad.y = hMap;
                hMap = this.landingPad.y;
            } else {
                // Rough
                hMap += (Math.random() - 0.5) * 60;
                // Clamp
                if (hMap > h - 20) hMap = h - 20;
                if (hMap < h * 0.3) hMap = h * 0.3;
            }
            this.terrain.push({ x: x, y: hMap });
        }
        // Final point
        this.terrain.push({ x: w, y: h });
        this.terrain.push({ x: 0, y: h }); // Close poly

        // Generate Collectibles (Fuel Stars)
        // Scatter them in the air
        this.collectibles = [];
        const starCount = 5 + Math.floor(w / 300); // Scale with width
        for (let i = 0; i < starCount; i++) {
            const cx = 200 + Math.random() * (w - 400);
            const cy = 100 + Math.random() * (h * 0.6);
            this.collectibles.push({ x: cx, y: cy, active: true, radius: 15 });
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    }

    loop() {
        if (!this.isRunning) return;
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        if (this.isGameOver) return;

        const p = this.player;

        // Rotate
        if (this.keys.left) p.angle -= this.rotateSpeed;
        if (this.keys.right) p.angle += this.rotateSpeed;

        // Thrust
        if (this.keys.thrust && p.fuel > 0) {
            // Apply force in direction of angle (0 is UP)
            // sin(a) for x, -cos(a) for y
            p.vx += Math.sin(p.angle) * this.thrustPower;
            p.vy -= Math.cos(p.angle) * this.thrustPower;
            p.fuel -= 0.2;
        }

        // Gravity
        p.vy += this.gravity;

        // Movement
        p.x += p.vx;
        p.y += p.vy;

        // Screen Wrap/Bounds
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) {
            p.y = 0;
            p.vy = 0; // Ceiling
        }

        // Collision Detection
        if (this.checkCollision()) {
            this.handleCollision();
        }

        // Collectibles Collision
        for (let c of this.collectibles) {
            if (!c.active) continue;
            const dx = p.x - c.x;
            const dy = p.y - c.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < p.width + c.radius) {
                c.active = false;
                this.score += 50;
                p.fuel = Math.min(100, p.fuel + 15); // Refuel
                // Juice
                this.triggerCollectEffect(c.x, c.y);
            }
        }

        this.updateUI();
    }

    triggerCollectEffect(x, y) {
        // Simple visual pop? 
        // For now, just score text update
    }

    checkCollision() {
        // Iterate terrain lines
        // Check if player center is below terrain height at that X
        // Approximation
        const p = this.player;

        // Find segment
        for (let i = 0; i < this.terrain.length - 1; i++) {
            const p1 = this.terrain[i];
            const p2 = this.terrain[i + 1];

            if (p.x >= p1.x && p.x <= p2.x) {
                // Interpolate Y
                const ratio = (p.x - p1.x) / (p2.x - p1.x);
                const terrY = p1.y + (p2.y - p1.y) * ratio;

                // Hit?
                if (p.y + 10 >= terrY) {
                    return true; // Simple ground hit
                }
            }
        }
        return false;
    }

    handleCollision() {
        const p = this.player;
        // Check Landing Conditions
        // 1. Must be on Pad
        const onPad = (p.x > this.landingPad.x && p.x < this.landingPad.x + this.landingPad.width);

        // 2. Speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const slowEnough = speed < this.landingMaxSpeed;

        // 3. Angle
        // Normalize angle to -PI to PI
        let a = p.angle % (Math.PI * 2);
        if (a > Math.PI) a -= Math.PI * 2;
        if (a < -Math.PI) a += Math.PI * 2;
        const upright = Math.abs(a) < this.landingMaxAngle;

        if (onPad && slowEnough && upright) {
            // SUCCESS
            this.levelComplete();
        } else {
            // CRASH
            this.crash(onPad ? "Too Hard/Tilted!" : "Missed Pad!");
        }
    }

    levelComplete() {
        this.score += Math.floor(this.player.fuel * 10);
        this.level++;
        this.reset();
        // Maybe show toast?
    }

    crash(reason) {
        this.isGameOver = true;
        this.isRunning = false;
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('go-message').innerText = reason;
        document.getElementById('final-score').innerText = 'Score: ' + this.score;
        document.getElementById('go-title').innerText = "CRASHED";
        document.getElementById('go-title').style.color = "#FF3333";
    }

    updateUI() {
        document.getElementById('score-display').innerText = `Level: ${this.level} | Score: ${this.score}`;
        const fuelEl = document.getElementById('fuel-display');
        fuelEl.innerText = `Fuel: ${Math.floor(this.player.fuel)}%`;
        fuelEl.style.color = this.player.fuel < 20 ? '#FF0000' : '#00FFFF';

        const alt = Math.floor(this.landingPad.y - this.player.y);
        document.getElementById('alt-display').innerText = `Alt: ${Math.max(0, alt)}`;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Background Stars
        this.ctx.fillStyle = '#FFF';
        // (Optim: draw once to canvas)

        // Terrain
        this.ctx.fillStyle = '#222';
        this.ctx.strokeStyle = '#AAA';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        if (this.terrain.length > 0) this.ctx.moveTo(this.terrain[0].x, this.terrain[0].y);
        for (let p of this.terrain) {
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.stroke();
        this.ctx.fill();

        // Collectibles
        this.ctx.fillStyle = '#FFD700'; // Gold
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#FFD700';
        for (let c of this.collectibles) {
            if (!c.active) continue;
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, c.radius * (0.8 + Math.sin(Date.now() * 0.005) * 0.2), 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;

        // Landing Pad
        if (this.landingPad) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(this.landingPad.x, this.landingPad.y - 2, this.landingPad.width, 4);
            // Lights
            this.ctx.fillStyle = '#AAFFAA';
            this.ctx.fillRect(this.landingPad.x, this.landingPad.y, 5, 20); // pole
            this.ctx.fillRect(this.landingPad.x + this.landingPad.width - 5, this.landingPad.y, 5, 20); // pole
        }

        // Player
        this.renderPlayer();
    }

    renderPlayer() {
        const p = this.player;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.angle);

        // Lander Body
        this.ctx.fillStyle = '#EEE'; // Puff
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Helmet/Face
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText(p.fuel <= 0 ? 'x_x' : 'o_o', 0, 3);

        // Legs
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-8, 5); this.ctx.lineTo(-12, 12); this.ctx.lineTo(-15, 12);
        this.ctx.moveTo(8, 5); this.ctx.lineTo(12, 12); this.ctx.lineTo(15, 12);
        this.ctx.stroke();

        // Thruster
        if (this.keys.thrust && p.fuel > 0 && !this.isGameOver) {
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.beginPath();
            this.ctx.moveTo(-5, 10);
            this.ctx.lineTo(0, 20 + Math.random() * 10);
            this.ctx.lineTo(5, 10);
            this.ctx.fill();
        }

        this.ctx.restore();
    }
}
