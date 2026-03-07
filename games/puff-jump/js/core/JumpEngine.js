export class JumpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Config
        this.GRAVITY = 0.8; // Heavier feel
        this.JUMP_FORCE = -14; // Snappier jump
        this.HOLD_GRAVITY_MOD = 0.45;
        this.INITIAL_SPEED = 12; // Start faster
        this.MAX_SPEED = 40; // Go much faster
        this.SPEED_INC = 0.008;

        // State
        this.isRunning = false;
        this.score = 0; // Distance
        this.speed = this.INITIAL_SPEED;
        this.isGameOver = false;
        this.frameCount = 0;
        // this.hue = 0; // Removed neon hue cycle

        // Input
        this.input = { jump: false, jumpPressed: false };

        // Entities
        this.player = {
            x: 100, // Fixed X
            y: 0,
            w: 40,
            h: 40,
            vy: 0,
            grounded: false,
            rotation: 0,
            color: '#FFFFFF' // White Puff
        };

        this.cameraY = 0;
        this.shake = 0;

        this.buildings = [];
        this.particles = [];
        this.bgs = []; // Background layers

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInput() {
        const jumpStart = (e) => {
            if (this.isGameOver) return;
            e.preventDefault();
            this.input.jump = true;
            this.input.jumpPressed = true;
        };
        const jumpEnd = (e) => {
            e.preventDefault();
            this.input.jump = false;
        };

        window.addEventListener('mousedown', jumpStart);
        window.addEventListener('mouseup', jumpEnd);
        window.addEventListener('touchstart', jumpStart, { passive: false });
        window.addEventListener('touchend', jumpEnd);
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') jumpStart(e);
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') jumpEnd(e);
        });
    }

    reset() {
        this.isGameOver = false;
        this.score = 0;
        this.speed = this.INITIAL_SPEED;
        this.frameCount = 0;
        this.shake = 0;

        this.player.y = this.canvas.height / 2;
        this.player.vy = 0;
        this.player.grounded = false;
        this.player.rotation = 0;

        this.buildings = [];
        this.particles = [];
        this.bgs = [];

        // Initial Platform (Long and safe)
        this.addBuilding(0, 1000, this.canvas.height * 0.7);

        // Init Background - City Layers
        this.bgs = [];
        for (let i = 0; i < 3; i++) {
            this.bgs.push([]); // 3 Layers
        }
        // Fill initial BG
        for (let i = 0; i < 30; i++) {
            this.addBgObject(Math.random() * this.canvas.width);
        }

        document.getElementById('game-over').style.display = 'none';
        document.getElementById('hint').style.display = 'block';
    }

    restart() {
        this.reset();
        this.start();
    }

    addBuilding(x, w, y) {
        // Puff Style: Grassy Platforms
        let type = 'floor';
        let color = '#4CAF50'; // Green
        let moving = false;
        let moveSpeedY = 0;

        // 20% Chance for Moving Platform (Vertical)
        if (Math.random() < 0.2 && x > 2000) {
            moving = true;
            moveSpeedY = (Math.random() - 0.5) * 4;
            color = '#8BC34A'; // Lighter Green
            // Keep them slightly smaller
            w = Math.min(w, 300);
        }

        this.buildings.push({
            x, y, w, h: this.canvas.height - y + 500,
            type, color,
            moving, moveSpeedY, startY: y
        });

        // Spikes! (The core Geometry Dash hazard)
        if (!moving && Math.random() < 0.6) {
            const count = 1 + Math.floor(Math.random() * 3); // 1-3 spikes
            const spikeW = 40;
            const startX = x + 200 + Math.random() * (w - 400); // Middle of platform

            for (let i = 0; i < count; i++) {
                this.buildings.push({
                    x: startX + (i * spikeW),
                    y: y - 40,
                    w: spikeW, h: 40,
                    type: 'spike',
                    color: '#F00'
                });
            }
        }
    }

    getNeonColor() {
        // Deprecated, unused
        return '#4CAF50';
    }

    addBgObject(xOffset) {
        // Clouds!
        const layer = Math.floor(Math.random() * 3);
        const z = 0.2 + (layer * 0.3); // Speed mult
        const y = Math.random() * (this.canvas.height * 0.6); // Top 60% of screen
        const size = 50 + Math.random() * 100;

        this.bgs[layer].push({
            x: xOffset,
            y: y,
            w: size * 2,
            h: size,
            z: z,
            type: 'cloud'
        });
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

        this.frameCount++;

        // Input Physics
        if (this.input.jumpPressed) {
            if (this.player.grounded) {
                this.player.vy = this.JUMP_FORCE;
                this.player.grounded = false;
                this.spawnParticles(this.player.x, this.player.y + this.player.h, 5, '#FFF');
                document.getElementById('hint').style.display = 'none';
            }
            this.input.jumpPressed = false; // Consume frame press
        }

        // Variable Jump Height
        let g = this.GRAVITY;
        if (this.input.jump && this.player.vy < 0) {
            g *= this.HOLD_GRAVITY_MOD;
        }

        this.player.vy += g;
        this.player.y += this.player.vy;

        // Scroll World
        this.speed = Math.min(this.MAX_SPEED, this.speed + this.SPEED_INC);
        this.score += (this.speed / 10);
        // this.hue += 0.5; // Color cycle

        // Move Buildings
        let lastB = null;
        for (let i = this.buildings.length - 1; i >= 0; i--) {
            let b = this.buildings[i];
            b.x -= this.speed;

            // Moving Platforms Logic
            if (b.moving) {
                b.y += b.moveSpeedY;
                // Bob up and down
                if (b.y < b.startY - 100 || b.y > b.startY + 100) {
                    b.moveSpeedY *= -1;
                }
            }

            if (b.x + b.w < -200) {
                this.buildings.splice(i, 1);
            } else {
                if (b.type === 'floor' && !b.moving) {
                    if (!lastB || b.x + b.w > lastB.x + lastB.w) lastB = b;
                }
            }
        }

        // Gen New Buildings
        if (lastB && lastB.x + lastB.w < this.canvas.width + 200) {
            const gap = 100 + (this.speed * 15) + (Math.random() * 100);
            const w = 500 + (Math.random() * 1000);
            const deltaH = (Math.random() - 0.5) * 300;
            let y = lastB.y + deltaH;

            // Clamp Y
            y = Math.min(this.canvas.height * 0.9, Math.max(this.canvas.height * 0.3, y));

            this.addBuilding(lastB.x + lastB.w + gap, w, y);
        }

        // Collision
        this.player.grounded = false;
        // Simple AABB for now, but specialized for Runner
        // Check if player enters a building from top
        // OR hits side

        const px = this.player.x;
        const py = this.player.y;
        const pw = this.player.w;
        const ph = this.player.h;

        for (let i = this.buildings.length - 1; i >= 0; i--) {
            let b = this.buildings[i];

            // Hitbox shrinking for fairness
            const hitX = px + 5;
            const hitW = pw - 10;
            const hitY = py + 5;
            const hitH = ph - 10;

            // Spike Collision (Instant Death)
            if (b.type === 'spike') {
                // Triangle collision approximation (Hitbox center check)
                if (px + pw > b.x + 10 && px < b.x + b.w - 10 &&
                    py + ph > b.y + 10) {
                    this.gameOver("SPIKED!");
                }
                continue;
            }

            // Floor Collision
            if (px + pw > b.x && px < b.x + b.w) {
                // Land on top
                // Dynamic Y check for moving platforms
                if (py + ph >= b.y && py + ph <= b.y + this.speed + 30 + Math.abs(b.moveSpeedY || 0)) {
                    if (this.player.vy >= 0) {
                        this.player.y = b.y - ph;
                        this.player.vy = 0;
                        if (!this.player.grounded) {
                            this.player.grounded = true;
                            this.spawnParticles(px, py + ph, 5, b.color); // Neon sparks
                        }
                        // Apply Platform Velocity if grounded
                        if (b.moving) {
                            this.player.y += b.moveSpeedY;
                        }
                    }
                }
                // Hit side (Faceplant)
                else if (py + ph > b.y + 10 && px + pw > b.x && px < b.x + 30) {
                    this.gameOver("CRASHED!");
                }
            }
        }

        // Rolling Physics
        if (this.player.grounded) {
            this.player.rotation += 0.2; // Roll on ground
            this.player.expression = 'normal';
            if (this.speed > 30) this.player.expression = 'shock';
        } else {
            this.player.rotation += 0.1; // Rotate slowly in air
            this.player.expression = 'jump';

            if (this.player.vy > 5) this.player.expression = 'shock'; // Falling fast
        }
        if (this.player.rotation > Math.PI * 2) this.player.rotation -= Math.PI * 2;

        if (this.isGameOver) this.player.expression = 'dead';

        // Pit Death
        if (this.player.y > this.canvas.height + 100) {
            this.gameOver("FELL!");
        }

        // Juice Update
        if (this.shake > 0) this.shake *= 0.85;
        if (this.shake < 0.5) this.shake = 0;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x -= this.speed * 0.8; // Particles lag behind
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Background
        for (let layer of this.bgs) {
            for (let bg of layer) {
                bg.x -= (this.speed * bg.z * 0.5);
                // Wrap visual
                if (bg.x + bg.w < -100) {
                    bg.x = this.canvas.width + Math.random() * 200;
                    // Randomize height again
                    bg.h = 100 + Math.random() * 400;
                    bg.y = this.canvas.height - (bg.h * bg.z) + 100;
                }
            }
        }

        document.getElementById('score-display').innerText = Math.floor(this.score) + "m";
    }

    spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 1) * 5,
                life: 30 + Math.random() * 20,
                color,
                size: 2 + Math.random() * 5
            });
        }
    }

    gameOver(reason) {
        this.isGameOver = true;
        this.isRunning = false;

        this.shake = 20;
        this.spawnParticles(this.player.x, this.player.y, 50, '#FF0055');

        setTimeout(() => {
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('final-score').innerText = 'Distance: ' + Math.floor(this.score) + 'm';
            if (navigator.vibrate) navigator.vibrate(200);
        }, 500);
    }

    drawFace(x, y, r, expression) {
        this.ctx.fillStyle = '#111';
        this.ctx.strokeStyle = '#111';
        this.ctx.lineWidth = 2;

        // Eye positions
        const eyeOffX = r * 0.35;
        const eyeOffY = -r * 0.1;
        const eyeSize = r * 0.15;

        if (expression === 'dead') {
            // X X
            this.drawX(x - eyeOffX, y + eyeOffY, eyeSize);
            this.drawX(x + eyeOffX, y + eyeOffY, eyeSize);
            // Mouth
            this.ctx.beginPath(); this.ctx.arc(x, y + r * 0.4, r * 0.1, 0, Math.PI * 2); this.ctx.stroke();
        } else if (expression === 'jump') {
            // > < (Closed tight)
            // Left >
            this.ctx.beginPath();
            this.ctx.moveTo(x - eyeOffX - eyeSize, y + eyeOffY - eyeSize / 2);
            this.ctx.lineTo(x - eyeOffX, y + eyeOffY);
            this.ctx.lineTo(x - eyeOffX - eyeSize, y + eyeOffY + eyeSize / 2);
            this.ctx.stroke();
            // Right <
            this.ctx.beginPath();
            this.ctx.moveTo(x + eyeOffX + eyeSize, y + eyeOffY - eyeSize / 2);
            this.ctx.lineTo(x + eyeOffX, y + eyeOffY);
            this.ctx.lineTo(x + eyeOffX + eyeSize, y + eyeOffY + eyeSize / 2);
            this.ctx.stroke();

            // Mouth (O)
            this.ctx.beginPath(); this.ctx.arc(x, y + r * 0.3, r * 0.1, 0, Math.PI * 2); this.ctx.fill();
        } else if (expression === 'shock') {
            // O O (Wide)
            this.ctx.beginPath(); this.ctx.arc(x - eyeOffX, y + eyeOffY, eyeSize * 1.2, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.beginPath(); this.ctx.arc(x + eyeOffX, y + eyeOffY, eyeSize * 1.2, 0, Math.PI * 2); this.ctx.fill();
            // Mouth (Line)
            this.ctx.beginPath(); this.ctx.moveTo(x - 5, y + r * 0.4); this.ctx.lineTo(x + 5, y + r * 0.4); this.ctx.stroke();
        } else {
            // Normal o o
            this.ctx.beginPath(); this.ctx.arc(x - eyeOffX, y + eyeOffY, eyeSize, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.beginPath(); this.ctx.arc(x + eyeOffX, y + eyeOffY, eyeSize, 0, Math.PI * 2); this.ctx.fill();
            // Mouth (Smile)
            this.ctx.beginPath(); this.ctx.arc(x, y + r * 0.1, r * 0.4, 0.2 * Math.PI, 0.8 * Math.PI); this.ctx.stroke();
        }

        // Cheeks (always cute)
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
        this.ctx.beginPath(); this.ctx.arc(x - r * 0.5, y + r * 0.2, r * 0.15, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.arc(x + r * 0.5, y + r * 0.2, r * 0.15, 0, Math.PI * 2); this.ctx.fill();
    }

    drawX(x, y, s) {
        this.ctx.beginPath();
        this.ctx.moveTo(x - s, y - s); this.ctx.lineTo(x + s, y + s);
        this.ctx.moveTo(x + s, y - s); this.ctx.lineTo(x - s, y + s);
        this.ctx.stroke();
    }
    render() {
        // Bright Blue Sky Gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#4FC3F7'); // Sky Blue
        gradient.addColorStop(1, '#E1F5FE'); // Light Blue/White horizon
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Shake
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Draw Walking Clouds
        for (let layer of this.bgs) {
            for (let bg of layer) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + (bg.z * 0.4)})`;
                // Simple Cloud Shape (3 bumps)
                this.ctx.beginPath();
                this.ctx.arc(bg.x, bg.y, bg.h * 0.5, 0, Math.PI * 2);
                this.ctx.arc(bg.x + bg.w * 0.3, bg.y - bg.h * 0.2, bg.h * 0.6, 0, Math.PI * 2);
                this.ctx.arc(bg.x + bg.w * 0.6, bg.y, bg.h * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Buildings (Grass Platforms)
        for (let b of this.buildings) {
            if (b.type === 'spike') {
                this.ctx.fillStyle = '#D32F2F'; // Red Spikes
                this.ctx.beginPath();
                this.ctx.moveTo(b.x, b.y + b.h);
                this.ctx.lineTo(b.x + b.w / 2, b.y);
                this.ctx.lineTo(b.x + b.w, b.y + b.h);
                this.ctx.fill();
                this.ctx.strokeStyle = '#B71C1C';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else {
                // Dirt Body
                this.ctx.fillStyle = '#795548'; // Brown
                this.ctx.fillRect(b.x, b.y, b.w, b.h);

                // Grass Top
                this.ctx.fillStyle = b.color; // Green
                this.ctx.fillRect(b.x, b.y, b.w, 20);

                // Grass Decoration (Strip)
                this.ctx.fillStyle = '#8BC34A'; // Lighter green highlight
                this.ctx.fillRect(b.x, b.y, b.w, 5);
            }
        }

        // Player (Rolling Puff Style - ROUND)
        const p = this.player;
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(p.rotation);

        // Puff Body (White/Pink Tint)
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Shadow/Shading
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.w / 2, 0.5 * Math.PI, 1.5 * Math.PI);
        this.ctx.fill();

        // Face Drawing
        this.drawFace(0, 0, p.w / 2, p.expression);

        this.ctx.restore();

        // Speed Trail
        // ... (Optional, skip for clarity/perf)

        this.ctx.restore();

        // Particles
        for (let pt of this.particles) {
            this.ctx.fillStyle = pt.color;
            this.ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        }
    }
}
