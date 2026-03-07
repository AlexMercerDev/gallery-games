export class DrillEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game Constants
        this.TILE_SIZE = 50;
        this.GRID_W = 0; // Calculated based on screen width
        this.GRID_H = 0; // Calculated based on screen height usually, but we scroll
        this.SCROLL_THRESHOLD = 0.4; // Screen ratio where camera moves

        this.AIR_DECAY = 0.05;
        this.AIR_MAX = 100;

        // State
        this.isRunning = false;
        this.score = 0;
        this.depth = 0;
        this.air = this.AIR_MAX;
        this.isGameOver = false;

        // Engagement
        this.combo = 0;
        this.comboTimer = 0;

        this.cameraY = 0;

        // Player
        this.player = {
            gridX: 0,
            gridY: 0,
            pixelX: 0,
            pixelY: 0,
            direction: 2, // 0: Up, 1: Right, 2: Down, 3: Left (Clockwise)
            state: 'idle', // idle, moving, drilling
            moveProgress: 0, // 0 to 1
            moveSpeed: 0.25 // Tiles per frame (Faster!)
        };

        // World: Map<string "x,y", object>
        this.blocks = new Map();
        // Visuals
        this.particles = [];

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Recalc Grid Dimensions
        this.GRID_W = Math.ceil(this.canvas.width / this.TILE_SIZE);
        this.GRID_H = Math.ceil(this.canvas.height / this.TILE_SIZE) + 2;
    }

    setupInput() {
        this.keys = { left: false, right: false, down: false, up: false };

        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
            if (e.key === 'ArrowDown') this.keys.down = true;
            // if (e.key === 'ArrowUp') this.keys.up = true; // Can't drill up usually?
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
            if (e.key === 'ArrowDown') this.keys.down = false;
        });

        const bindBtn = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            // Prevent default to stop scrolling/zooming
            const handler = (e) => { e.preventDefault(); this.keys[key] = (e.type === 'touchstart' || e.type === 'mousedown'); };
            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; }, { passive: false });
            btn.addEventListener('mousedown', handler);
            btn.addEventListener('mouseup', (e) => { e.preventDefault(); this.keys[key] = false; });
        };
        bindBtn('btn-left', 'left');
        bindBtn('btn-right', 'right');
        bindBtn('btn-down', 'down');

        // Tap Zones (Fallback/Alternative)
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.target !== this.canvas) return; // Ignore if on button
            e.preventDefault();
            const touch = e.touches[0];
            const w = window.innerWidth;
            const h = window.innerHeight;

            // Simple Zones
            if (touch.clientY > h * 0.7 && touch.clientX > w * 0.3 && touch.clientX < w * 0.7) {
                this.keys.down = true;
                this.vizTap = { x: w / 2, y: h * 0.85, r: 50, life: 10 }; // Visual ripple
            } else if (touch.clientX < w * 0.5) {
                this.keys.left = true;
                this.vizTap = { x: w * 0.25, y: h * 0.5, r: 50, life: 10 };
            } else {
                this.keys.right = true;
                this.vizTap = { x: w * 0.75, y: h * 0.5, r: 50, life: 10 };
            }
            if (navigator.vibrate) navigator.vibrate(5);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.left = false;
            this.keys.right = false;
            this.keys.down = false;
        }, { passive: false });
    }

    reset() {
        this.isGameOver = false;
        this.score = 0;
        this.depth = 0;
        this.air = this.AIR_MAX;
        this.combo = 0;
        this.cameraY = 0;

        this.blocks.clear();
        this.particles = [];

        // Center Player
        this.player.gridX = Math.floor(this.GRID_W / 2);
        this.player.gridY = 0; // Start at surface
        this.player.pixelX = this.player.gridX * this.TILE_SIZE;
        this.player.pixelY = this.player.gridY * this.TILE_SIZE;
        this.player.state = 'idle';
        this.player.moveProgress = 0;

        // Gen initial rows
        this.generateRows(0, 20);

        document.getElementById('game-over').style.display = 'none';
    }

    restart() {
        this.reset();
        this.start();
    }

    // Procedural Generation
    generateRows(startY, count) {
        for (let y = startY; y < startY + count; y++) {
            if (y < 2) continue; // Surface is empty air

            for (let x = 0; x < this.GRID_W; x++) {
                // Key
                const key = `${x},${y}`;
                if (this.blocks.has(key)) continue;

                // Logic
                let type = 'dirt';
                const rand = Math.random();

                // Layers
                // 0-50m: Dirt + sparse rocks
                // 50-100m: HardDirt + more rocks

                let rockChance = 0.05 + (y * 0.001); // Getting harder

                // Early Game Engagement: More Gold near surface!
                let goldChance = 0.05;
                if (y < 20) goldChance = 0.15; // 15% gold early on!

                if (rand < rockChance) type = 'rock';
                else if (rand > (1.0 - goldChance)) type = 'gold';
                else if (rand > 0.98) type = 'diamond';
                else if (rand > 0.90) type = 'air'; // Air pocket

                if (type !== 'air') {
                    this.blocks.set(key, { type, x, y, hp: 1 });
                }
            }
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

        // Input Handling (only if idle)
        if (this.player.state === 'idle') {
            let dx = 0;
            let dy = 0;
            let dir = -1;

            if (this.keys.down) { dx = 0; dy = 1; dir = 2; }
            else if (this.keys.left) { dx = -1; dy = 0; dir = 3; }
            else if (this.keys.right) { dx = 1; dy = 0; dir = 1; }

            if (dir !== -1) {
                this.attemptMove(dx, dy, dir);
            }
        } else if (this.player.state === 'moving' || this.player.state === 'drilling') {
            this.player.moveProgress += this.player.moveSpeed;
            if (this.player.moveProgress >= 1) {
                // Move complete
                this.completeMove();
            }
        }

        // Camera Follow
        const targetCamY = (this.player.gridY * this.TILE_SIZE) - (this.canvas.height * 0.3);
        if (targetCamY > this.cameraY) {
            this.cameraY += (targetCamY - this.cameraY) * 0.1; // Smooth lerp
        }

        // Gen more world
        const bottomRow = Math.floor((this.cameraY + this.canvas.height) / this.TILE_SIZE);
        this.generateRows(bottomRow, 10);

        // Air Decay
        this.air -= this.AIR_DECAY;
        if (this.air <= 0) {
            this.gameOver("OUT OF AIR");
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // grav
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Combo Decay
        if (this.combo > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                // UI update specific to combo handled in updateUI
            }
        }

        this.updateUI();
    }

    attemptMove(dx, dy, dir) {
        this.player.direction = dir;
        const targetX = this.player.gridX + dx;
        const targetY = this.player.gridY + dy;

        // Bounds
        if (targetX < 0 || targetX >= this.GRID_W) return;

        const key = `${targetX},${targetY}`;
        const block = this.blocks.get(key);

        if (!block) {
            // Empty space, move normally
            this.startMove(targetX, targetY, 'moving');
        } else if (block.type === 'rock') {
            // Clang!
            this.screenshake(5);
            // Maybe lose air?
            this.air -= 5;
            this.spawnParticles(targetX, targetY, '#888');
        } else {
            // Drillable
            this.blocks.delete(key);
            this.spawnParticles(targetX, targetY, this.getColorForType(block.type));
            this.screenshake(2);
            this.startMove(targetX, targetY, 'drilling');

            // Combo Logic
            this.combo++;
            this.comboTimer = 60; // 1 second to keep combo
            let multiplier = 1 + Math.floor(this.combo / 5);

            // Score/Effects
            if (block.type === 'gold') {
                this.score += 100 * multiplier;
                this.air = Math.min(this.AIR_MAX, this.air + 5);
                this.spawnFloatText(targetX, targetY, `+${100 * multiplier}!`, '#FFD700');
            } else if (block.type === 'diamond') {
                this.score += 500 * multiplier;
                this.air = Math.min(this.AIR_MAX, this.air + 15);
                this.spawnFloatText(targetX, targetY, `+${500 * multiplier}!!`, '#00FFFF');
            } else {
                this.score += 10 * multiplier;
            }
        }
    }

    spawnFloatText(gx, gy, text, color) {
        // We'll just use a particle for text? 
        // Or actually plain drawing in render. 
        // Let's add a text type to particles
        this.particles.push({
            type: 'text',
            text: text,
            x: (gx + 0.5) * this.TILE_SIZE,
            y: (gy + 0.5) * this.TILE_SIZE,
            vx: 0, vy: -1,
            life: 40,
            color: color
        });
    }

    startMove(tx, ty, state) {
        this.player.targetGridX = tx;
        this.player.targetGridY = ty;
        this.player.state = state;
        this.player.moveProgress = 0;

        // Start pixel iterp
        this.player.startPixelX = this.player.gridX * this.TILE_SIZE;
        this.player.startPixelY = this.player.gridY * this.TILE_SIZE;
        this.player.targetPixelX = tx * this.TILE_SIZE;
        this.player.targetPixelY = ty * this.TILE_SIZE;
    }

    completeMove() {
        this.player.gridX = this.player.targetGridX;
        this.player.gridY = this.player.targetGridY;
        this.player.pixelX = this.player.targetPixelX;
        this.player.pixelY = this.player.targetPixelY;
        this.player.state = 'idle';

        // Update Depth
        this.depth = Math.max(this.depth, this.player.gridY);
    }

    screenshake(mag) {
        // Simple visual offset, resets next frame? 
        // We'll apply it in render
        this.shake = mag;
    }

    spawnParticles(gx, gy, color) {
        const cx = (gx + 0.5) * this.TILE_SIZE;
        const cy = (gy + 0.5) * this.TILE_SIZE;
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 20 + Math.random() * 10,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    }

    getColorForType(type) {
        if (type === 'dirt') return '#8B4513';
        if (type === 'rock') return '#555';
        if (type === 'gold') return '#FFD700';
        if (type === 'diamond') return '#00FFFF';
        return '#000';
    }

    gameOver(reason) {
        this.isGameOver = true;
        this.isRunning = false;

        document.getElementById('game-over').style.display = 'block';
        document.getElementById('go-title').innerText = reason;
        document.getElementById('final-score').innerText = 'Score: ' + this.score;
        document.getElementById('final-depth').innerText = 'Depth: ' + this.depth + 'm';
    }

    updateUI() {
        document.getElementById('score-display').innerText = this.score;
        document.getElementById('depth-display').innerText = `Depth: ${this.depth}m`;
        document.getElementById('air-display').innerText = `Air: ${Math.floor(this.air)}%`;

        // Show Combo
        if (this.combo > 1) {
            document.getElementById('depth-display').innerText += ` (x${1 + Math.floor(this.combo / 5)})`;
        }

        const airEl = document.getElementById('air-display');
        if (this.air < 20) airEl.style.color = '#FF0000';
        else airEl.style.color = '#00FFFF';
    }

    render() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Camera Transform
        let camY = -this.cameraY;

        // Shake
        if (this.shake > 0) {
            camY += (Math.random() - 0.5) * this.shake;
            let camX = (Math.random() - 0.5) * this.shake;
            this.ctx.translate(camX, 0);
            this.shake *= 0.8;
            if (this.shake < 0.5) this.shake = 0;
        }

        this.ctx.translate(0, camY);

        // Render Blocks
        // Optimization: Only render visible blocks
        const startRow = Math.floor(this.cameraY / this.TILE_SIZE);
        const endRow = startRow + Math.ceil(this.canvas.height / this.TILE_SIZE) + 1;

        for (let y = startRow; y <= endRow; y++) {
            for (let x = 0; x < this.GRID_W; x++) {
                const key = `${x},${y}`;
                const block = this.blocks.get(key);
                if (block) {
                    this.renderBlock(block);
                }
            }
        }

        // Render Player
        this.renderPlayer();


        // Render Particles
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            if (p.type === 'text') {
                this.ctx.font = 'bold 20px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(p.text, p.x, p.y);
            } else {
                this.ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        }

        // Render Tap Viz
        if (this.vizTap && this.vizTap.life > 0) {
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.vizTap.life / 10})`;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(this.vizTap.x, this.vizTap.y, this.vizTap.r - (this.vizTap.life * 2), 0, Math.PI * 2);
            this.ctx.stroke();
            this.vizTap.life--;
        }

        this.ctx.restore();
    }

    renderBlock(b) {
        const x = b.x * this.TILE_SIZE;
        const y = b.y * this.TILE_SIZE;
        const s = this.TILE_SIZE;

        this.ctx.fillStyle = this.getColorForType(b.type);
        this.ctx.fillRect(x, y, s, s);

        // Borders/Texture
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(x + s * 0.8, y, s * 0.2, s);
        this.ctx.fillRect(x, y + s * 0.8, s, s * 0.2);

        // Icon for gems
        if (b.type === 'gold' || b.type === 'diamond') {
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(x + s / 2, y + s / 2, s / 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Rock texture
        if (b.type === 'rock') {
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.moveTo(x + 5, y + 5);
            this.ctx.lineTo(x + s - 5, y + s - 5);
            this.ctx.stroke();
        }
    }

    renderPlayer() {
        let x = this.player.pixelX;
        let y = this.player.pixelY;

        // Interpolate if moving
        if (this.player.state === 'moving' || this.player.state === 'drilling') {
            const t = this.player.moveProgress;
            x = this.player.startPixelX + (this.player.targetPixelX - this.player.startPixelX) * t;
            y = this.player.startPixelY + (this.player.targetPixelY - this.player.startPixelY) * t;

            // Vibration if drilling
            if (this.player.state === 'drilling') {
                x += (Math.random() - 0.5) * 4;
                y += (Math.random() - 0.5) * 4;
            }
        }

        // Draw Puff
        const s = this.TILE_SIZE;
        const cx = x + s / 2;
        const cy = y + s / 2;

        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Rotate based on direction?
        // 0: Up, 1: Right, 2: Down, 3: Left
        if (this.player.direction === 1) this.ctx.rotate(-Math.PI / 2);
        if (this.player.direction === 3) this.ctx.rotate(Math.PI / 2);
        if (this.player.direction === 0) this.ctx.rotate(Math.PI);

        // Body
        this.ctx.fillStyle = '#EEE';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, s / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Helmet
        this.ctx.fillStyle = '#FFCC00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, s / 2 - 2, Math.PI, 0); // Top half
        this.ctx.fill();
        this.ctx.fillRect(-s / 2 + 2, -5, s - 4, 5); // Rim

        // Face
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.isGameOver ? 'x_x' : '>_<', 0, 5);

        // Drill
        this.ctx.fillStyle = '#888';
        this.ctx.beginPath();
        this.ctx.moveTo(-5, 10);
        this.ctx.lineTo(5, 10);
        this.ctx.lineTo(0, 25 + (Math.random() * 5));
        this.ctx.fill();

        this.ctx.restore();
    }
}
