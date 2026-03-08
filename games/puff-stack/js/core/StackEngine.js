export class StackEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.hasStarted = false;
        this.score = 0;
        this.isGameOver = false;

        // Settings
        this.blockHeight = 25;
        this.startWidth = 200;
        this.startSpeed = 3;

        // Stack
        this.stack = []; // {x, y, w, h, color}
        this.debris = []; // {x, y, w, h, vx, vy, color, life}

        // Current Block
        this.currentBlock = {
            x: 0, y: 0, w: 0, h: 0,
            dir: 1, // 1 or -1
            speed: 0,
            hue: 0
        };

        // Camera
        this.cameraY = 0;
        this.targetCameraY = 0;

        // Juice
        this.shake = 0;
        this.flash = 0;
        this.combo = 0;
        this.popups = []; // {x, y, text, life, dy}
        this.backgroundObjects = []; // Clouds/Stars

        // Skins
        this.skins = [
            { name: 'Classic', hueOffset: 0 },
            { name: 'Cool', hueOffset: 180 },
            { name: 'Mint', hueOffset: 120 },
            { name: 'Berry', hueOffset: 330 },
            { name: 'Royal', hueOffset: 280 },
            { name: 'Golden', hueOffset: 50 }
        ];
        this.currentSkin = parseInt(localStorage.getItem('puff-stack-skin')) || 0;

        this.centerX = 0; // For centering on wide screens

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input (Tap anywhere)
        const inputAction = (e) => {
            if (this.isGameOver) return;
            e.preventDefault();
            this.onTap();
        };
        document.addEventListener('mousedown', inputAction);
        document.addEventListener('touchstart', inputAction, { passive: false });
        // Spacebar
        document.addEventListener('keydown', e => {
            if (e.code === 'Space') inputAction(e);
        });

        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;
        this.hasStarted = false;
        this.stack = [];
        this.debris = [];
        this.popups = [];
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.combo = 0;

        // Initial Base Block
        // Center based on game width (e.g. 400px max)
        const startX = this.centerX - (this.startWidth / 2);
        const startY = this.canvas.height - 100;

        this.stack.push({
            x: startX,
            y: startY,
            w: this.startWidth,
            h: this.blockHeight,
            hue: 0
        });

        this.spawnNextBlock();
        this.initBackground();
    }

    initBackground() {
        this.backgroundObjects = [];
        for (let i = 0; i < 20; i++) {
            this.backgroundObjects.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 2, // Taller world
                r: 10 + Math.random() * 30,
                type: Math.random() > 0.5 ? 'cloud' : 'star',
                speed: (Math.random() + 0.1) * 0.5
            });
        }
    }

    spawnNextBlock() {
        const topBlock = this.stack[this.stack.length - 1];

        this.currentBlock.w = topBlock.w;
        this.currentBlock.h = this.blockHeight;
        this.currentBlock.hue = (topBlock.hue + 10) % 360;

        // Determine Y
        this.currentBlock.y = topBlock.y - this.blockHeight;

        // Random usage of direction? or alternate?
        // Alternate is standard
        this.currentBlock.dir = this.score % 2 === 0 ? 1 : -1;

        // Set X offscreen
        // Spawn distance relative to center
        const spawnLimit = 300; // Constrain spawn width
        this.currentBlock.x = this.currentBlock.dir === 1
            ? this.centerX - spawnLimit
            : this.centerX + spawnLimit - this.currentBlock.w;

        // Speed scaling
        this.currentBlock.speed = this.startSpeed + (this.score * 0.2); // Faster ramp
        if (this.currentBlock.speed > 20) this.currentBlock.speed = 20;
    }

    onTap() {
        if (!this.hasStarted) {
            this.hasStarted = true;
            if (this.onStart) this.onStart();
            return; // Don't place on first tap? Usually games let you play immediately.
            // Let's allow immediate place to keep rhythm.
        }

        this.placeBlock();
    }

    placeBlock() {
        const prev = this.stack[this.stack.length - 1];
        const curr = this.currentBlock;

        // Calculate Overlap
        const left1 = prev.x;
        const right1 = prev.x + prev.w;
        const left2 = curr.x;
        const right2 = curr.x + curr.w;

        // Intersection
        const start = Math.max(left1, left2);
        const end = Math.min(right1, right2);
        const overlap = end - start;

        if (overlap <= 0) {
            // Missed completely
            this.spawnDebris(curr.x, curr.y, curr.w, curr.h, curr.hue); // Whole block falls
            this.triggerGameOver();
        } else {
            // Hit!

            // Check for cut
            // Cut logic: Left overhang or Right overhang
            let newX = start;
            let newW = overlap;

            // Tolerance for "Perfect"
            if (Math.abs(curr.x - prev.x) < 5) { // Forgiving
                // Perfect! Snap to previous
                newX = prev.x;
                newW = prev.w; // Restore width to previous (don't shrink)
                this.flash = 0.5;
                this.combo++;

                this.spawnPopup(newX + newW / 2, curr.y, `Perfect! x${this.combo}`, '#FFF');

                // Reward: Grow slightly if combo high?
                if (this.combo >= 3) {
                    newW = Math.min(newW + 10, this.startWidth); // Grow max
                    newX -= 5; // Center growth
                    this.spawnPopup(newX + newW / 2, curr.y - 30, "Grow!", '#8BC34A');
                }
            } else {
                // Missed perfectly
                this.combo = 0;

                // What got cut off?
                // If curr.x < prev.x (Left side stuck out)
                if (curr.x < prev.x) {
                    const cutW = prev.x - curr.x;
                    this.spawnDebris(curr.x, curr.y, cutW, curr.h, curr.hue);
                }
                // If curr.x + w > prev.x + w (Right side stuck out)
                if (curr.x + curr.w > prev.x + prev.w) {
                    const cutX = prev.x + prev.w;
                    const cutW = (curr.x + curr.w) - (prev.x + prev.w);
                    this.spawnDebris(cutX, curr.y, cutW, curr.h, curr.hue);
                }
            }

            // Add new static block
            this.stack.push({
                x: newX,
                y: curr.y,
                w: newW,
                h: curr.h,
                hue: curr.hue
            });

            this.score++;
            this.shake = 2;

            // Move Camera?
            // Keep stack top around 2/3 down screen?
            // Actually, keep it at fixed relative position.
            // If stack goes above centerY, move camera up
            const absoluteTop = curr.y; // Y decreases as we go up
            const screenLimit = this.canvas.height / 2;

            if (absoluteTop < this.cameraY + screenLimit + 100) { // Keep some buffer
                // Don't need aggressive camera yet, just constant shift
            }
            // Target Camera Y should track the highest block relative to screen bottom
            // Let's say we want top block at height - 200
            this.targetCameraY = (this.canvas.height - 300) - curr.y;
            // Clamp so we don't look below ground
            if (this.targetCameraY < 0) this.targetCameraY = 0;

            this.spawnNextBlock();
        }
    }

    spawnDebris(x, y, w, h, hue) {
        this.debris.push({
            x: x, y: y, w: w, h: h,
            vx: (Math.random() - 0.5) * 5,
            vy: -2 + Math.random() * -3, // Pop up
            rot: 0,
            vrot: (Math.random() - 0.5) * 0.2,
            hue: hue,
            life: 60
        });
    }

    spawnPopup(x, y, text, color) {
        this.popups.push({ x, y, text, color, life: 60, dy: -1 });
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

        // Camera
        this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

        if (!this.hasStarted) return;

        // Move Current Block
        const b = this.currentBlock;
        b.x += b.speed * b.dir;

        // Bounce or Wrap? Standard is Ping Pong
        // Bounds check depends on when it moves completely off screen? 
        // Or just let it fly and player misses.
        // Let's standard ping pong for forgiveness? Or just let it fly?
        // Standard "Stack" game: ping pong.

        // Let's make it ping pong within a wider range so you can miss
        const lim = this.centerX + 400; // Wide limit
        if (b.x > lim && b.dir === 1) b.dir = -1;
        if (b.x < this.centerX - 400 - b.w && b.dir === -1) b.dir = 1;

        // Debris Physics
        for (let i = this.debris.length - 1; i >= 0; i--) {
            let d = this.debris[i];
            d.x += d.vx;
            d.y += d.vy;
            d.vy += 0.5; // Gravity
            d.rot += d.vrot;
            d.life--;
            if (d.life <= 0 || d.y > this.canvas.height + this.cameraY) {
                this.debris.splice(i, 1);
            }
        }

        // Popups
        for (let i = this.popups.length - 1; i >= 0; i--) {
            let p = this.popups[i];
            p.y += p.dy;
            p.life--;
            if (p.life <= 0) this.popups.splice(i, 1);
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;

        // Leaderboard
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-stack-leaderboard') || '[]');
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
            leaderboard = JSON.parse(localStorage.getItem('puff-stack-leaderboard') || '[]');
        } catch (e) { }
        leaderboard.push({ name: name, score: this.score, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('puff-stack-leaderboard', JSON.stringify(leaderboard));
    }

    render() {
        // Gradient Interpolation
        // Max height approx 100 blocks = 2500px
        const progress = Math.min(1, this.score / 50);

        // Sky Blue (135, 206, 235) -> Sunset (255, 112, 67) -> Space (26, 35, 126)
        let r, g, b;
        if (progress < 0.5) {
            // Blue to Sunset
            const t = progress * 2;
            r = 135 + (255 - 135) * t;
            g = 206 + (112 - 206) * t;
            b = 235 + (67 - 235) * t;
        } else {
            // Sunset to Space
            const t = (progress - 0.5) * 2;
            r = 255 + (26 - 255) * t;
            g = 112 + (35 - 112) * t;
            b = 67 + (126 - 67) * t;
        }

        const bgCSS = `rgb(${r},${g},${b})`;
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, bgCSS); // Top
        grad.addColorStop(1, '#FFF'); // Bottom haze

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Background Objects (Parallax)
        this.ctx.save();
        this.ctx.translate(0, this.cameraY * 0.5); // Move slower than camera

        for (let o of this.backgroundObjects) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            if (o.type === 'cloud') {
                this.ctx.arc(o.x, o.y - (this.score * 50), o.r, 0, Math.PI * 2); // Move clouds down as we go up
            } else {
                // Stars only deep up
                if (this.score > 20) {
                    this.ctx.arc(o.x, o.y - 1000, 2, 0, Math.PI * 2);
                }
            }
            this.ctx.fill();
        }
        this.ctx.restore();

        // Camera Transform
        this.ctx.save();

        // Shake
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        this.ctx.translate(0, this.cameraY); // Move world down as camera goes up

        // Draw Stack
        for (let block of this.stack) {
            this.drawBlock(block);
        }

        // Current Block
        if (this.hasStarted && !this.isGameOver) {
            this.drawBlock(this.currentBlock);
        }

        // Debris
        for (let d of this.debris) {
            this.ctx.save();
            this.ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
            this.ctx.rotate(d.rot);
            this.ctx.fillStyle = `hsl(${d.hue}, 70%, 60%)`;
            this.ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
            this.ctx.restore();
        }

        // Popups
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 24px sans-serif'; // Bigger
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';

        for (let p of this.popups) {
            this.ctx.save();
            this.ctx.globalAlpha = p.life / 30;

            // Stroke for contrast
            this.ctx.strokeText(p.text, p.x, p.y);

            this.ctx.fillStyle = p.color;
            this.ctx.fillText(p.text, p.x, p.y);

            this.ctx.restore();
        }

        this.ctx.restore(); // End Camera

        // Flash Overlay
        if (this.flash > 0.01) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flash})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Score HUD
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 60px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.fillText(`${this.score}`, this.canvas.width / 2, 100);
        this.ctx.shadowBlur = 0;

        // Combo HUD
        if (this.combo > 1) {
            this.ctx.font = 'bold 30px sans-serif';
            this.ctx.fillStyle = '#FFEB3B';
            this.ctx.fillText(`Combo x${this.combo}`, this.canvas.width / 2, 150);
        }
    }

    drawBlock(b) {
        const hue = (b.hue + this.skins[this.currentSkin].hueOffset) % 360;
        this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        this.ctx.fillRect(b.x, b.y, b.w, b.h);
        this.ctx.fillStyle = `rgba(255,255,255,0.3)`; // Top highlight
        this.ctx.fillRect(b.x, b.y, b.w, 5);
        this.ctx.fillStyle = `rgba(0,0,0,0.1)`; // Side shadow
        this.ctx.fillRect(b.x + b.w - 5, b.y, 5, b.h);
    }

    nextSkin() {
        this.currentSkin = (this.currentSkin + 1) % this.skins.length;
        localStorage.setItem('puff-stack-skin', this.currentSkin);
    }
}
