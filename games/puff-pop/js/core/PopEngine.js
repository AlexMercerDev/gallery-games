export class PopEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.score = 0;
        this.highscore = 0;
        this.isGameOver = false;

        // Configuration
        this.cols = 8;
        this.rows = 12;
        this.radius = 25; // Bubble radius
        this.diameter = this.radius * 2;
        this.gridWidth = 0; // Calculated
        this.offsetX = 0;
        this.offsetY = 50;

        // Colors/Faces (Reused)
        this.colors = [
            { c: '#FFB7B2', f: '^.^' }, // Pink
            { c: '#B5EAD7', f: '>.<' }, // Mint
            { c: '#E2F0CB', f: 'o.o' }, // Lime
            { c: '#FFDAC1', f: 'OwO' }, // Peach
            { c: '#C7CEEA', f: 'U_U' }, // Lavender
        ];

        // Entities
        this.grid = []; // [row][col] -> { type: index, active: bool, x, y }
        this.projectile = null; // { x, y, vx, vy, type }
        this.nextProjectileType = 0;
        this.particles = []; // { x, y, vx, vy, life, color }

        // Juice
        this.shake = 0;

        // Aiming
        this.mouse = { x: 0, y: 0 };
        this.cannonAngle = -Math.PI / 2;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        canvas.addEventListener('mousemove', e => this.onMove(e));
        canvas.addEventListener('mouseup', e => this.onClick(e));
        canvas.addEventListener('touchmove', e => { e.preventDefault(); this.onMove(e.touches[0]); }, { passive: false });
        canvas.addEventListener('touchend', e => { e.preventDefault(); this.onClick(); }, { passive: false });

        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Calculate Grid
        // Hex Layout:
        // Width = cols * diameter + (0.5 * diameter if odd rows offset) -> Actually approx cols * diameter
        this.gridWidth = this.cols * this.diameter + (this.radius);
        this.offsetX = (this.canvas.width - this.gridWidth) / 2;

        // Ensure bounds
        if (this.offsetX < 10) {
            // Screen too narrow, reduce radius? Or scroll?
            // For now, let's keep it simple
            this.offsetX = 10;
        }
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;

        // Init Grid
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                // Determine Offset
                // Odd rows (1, 3, 5..) shifted right by radius
                // If it's an odd row, we might have one less col depending on implementation
                // Let's keep cols constant but visually shift

                // Populate first 5 rows
                let type = -1;
                if (r < 5) {
                    type = Math.floor(Math.random() * this.colors.length);
                }

                this.grid[r][c] = {
                    type: type,
                    active: type !== -1
                };
            }
        }

        this.activeBubbles = []; // List for easy iteration if needed? 
        // Actually, let's just iterate the grid.

        this.nextProjectileType = Math.floor(Math.random() * this.colors.length);
        this.spawnProjectile();
    }

    spawnProjectile() {
        if (this.isGameOver) return;
        this.projectile = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            vx: 0,
            vy: 0,
            type: this.nextProjectileType,
            moving: false
        };
        this.nextProjectileType = Math.floor(Math.random() * this.colors.length);
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
        this.mouse.x = (e.clientX || e.pageX) - rect.left;
        this.mouse.y = (e.clientY || e.pageY) - rect.top;

        // Calculate Angle
        const dx = this.mouse.x - (this.canvas.width / 2);
        const dy = this.mouse.y - (this.canvas.height - 50);
        this.cannonAngle = Math.atan2(dy, dx);

        // Clamp Angle (don't shoot down or too flat)
        // -PI/2 is UP.
        // Limit to -10 deg to -170 deg (approx)
        const minAngle = -Math.PI + 0.2;
        const maxAngle = -0.2;

        this.cannonAngle = Math.max(minAngle, Math.min(this.cannonAngle, maxAngle));
    }

    onClick() {
        if (this.isGameOver) return;
        if (this.projectile && !this.projectile.moving) {
            const speed = 15;
            this.projectile.vx = Math.cos(this.cannonAngle) * speed;
            this.projectile.vy = Math.sin(this.cannonAngle) * speed;
            this.projectile.moving = true;
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

        // Juice Decay
        if (this.shake > 0) this.shake *= 0.9;

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Slight gravity
            p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Projectile Movement
        if (this.projectile && this.projectile.moving) {
            this.projectile.x += this.projectile.vx;
            this.projectile.y += this.projectile.vy;

            // Wall Bounce
            // Left Valid Border: this.offsetX
            // Right Valid Border: this.offsetX + this.gridWidth
            if (this.projectile.x - this.radius < this.offsetX) {
                this.projectile.x = this.offsetX + this.radius;
                this.projectile.vx *= -1;
            }
            const rightBorder = this.offsetX + (this.cols * this.diameter); // Approx
            // Wait, grid calculation needs to be precise for walls. 
            // Let's use canvas width for walls for now, but really we should constrain to the playing field.
            // We'll constrain to canvas side walls for simplicity first.
            if (this.projectile.x - this.radius < 0) {
                this.projectile.x = this.radius;
                this.projectile.vx *= -1;
            }
            if (this.projectile.x + this.radius > this.canvas.width) {
                this.projectile.x = this.canvas.width - this.radius;
                this.projectile.vx *= -1;
            }

            // Top Collision
            if (this.projectile.y - this.radius < this.offsetY) {
                this.snapToGrid();
            }

            // Grid Collision (Circle vs Circle)
            // Iterate all active bubbles
            let hit = false;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const b = this.grid[r][c];
                    if (b.active) {
                        const pos = this.getGridPos(r, c);
                        const dx = this.projectile.x - pos.x;
                        const dy = this.projectile.y - pos.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < this.diameter - 5) { // Slight overlap allowance
                            hit = true;
                            break;
                        }
                    }
                }
                if (hit) break;
            }

            if (hit) {
                this.shake = 5; // Screen shake on impact
                this.snapToGrid();
            }
        }
    }

    getGridPos(r, c) {
        // Hex Coordinates
        // x = c * diameter + (r is odd ? radius : 0)
        // y = r * (diameter * 0.85 approx for tight pack)
        const rowHeight = this.radius * Math.sqrt(3); // Tight pack sin(60)

        let x = this.offsetX + (c * this.diameter) + this.radius;
        if (r % 2 !== 0) {
            x += this.radius;
        }
        let y = this.offsetY + (r * rowHeight) + this.radius;

        return { x, y };
    }

    snapToGrid() {
        this.projectile.moving = false;

        // Find nearest grid cell
        let bestDist = Infinity;
        let bestRC = null;

        // Search plausible rows near Y
        // Reverse calculation?
        // Let's brute force valid empty cells for now (simple)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Skip if active
                if (this.grid[r][c].active) continue;

                const pos = this.getGridPos(r, c);
                const dx = this.projectile.x - pos.x;
                const dy = this.projectile.y - pos.y;
                const dist = dx * dx + dy * dy;

                if (dist < bestDist) {
                    bestDist = dist;
                    bestRC = { r, c };
                }
            }
        }

        if (bestRC) {
            this.grid[bestRC.r][bestRC.c].active = true;
            this.grid[bestRC.r][bestRC.c].type = this.projectile.type;

            // Spawn particles on impact
            const pos = this.getGridPos(bestRC.r, bestRC.c);
            this.spawnParticles(pos.x, pos.y, this.colors[this.projectile.type].c, 12);

            // TODO: Match 3 Logic
            // TODO: Drop Logic
            this.score += 10;
        }

        // End condition check?

        // Respawn
        this.spawnProjectile();
    }

    render() {
        // Clear
        this.ctx.fillStyle = '#FFF9C4';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply Screen Shake
        this.ctx.save();
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Grid
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const b = this.grid[r][c];
                const pos = this.getGridPos(r, c);

                // Draw Cell Placeholder (faint)
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, this.radius - 2, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                this.ctx.stroke();

                if (b.active && b.type !== -1) {
                    this.drawBubble(pos.x, pos.y, this.colors[b.type]);
                }
            }
        }

        // Projectile
        if (this.projectile) {
            this.drawBubble(this.projectile.x, this.projectile.y, this.colors[this.projectile.type]);
        }

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

        // Next Projectile Preview
        const nextCol = this.colors[this.nextProjectileType];
        this.drawBubble(this.canvas.width / 2 + 40, this.canvas.height - 50, nextCol, 15);
        this.ctx.fillStyle = '#555';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText("Next", this.canvas.width / 2 + 40, this.canvas.height - 20);

        // Cannon / Aim Line
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height - 50);
        this.ctx.lineTo(this.canvas.width / 2 + Math.cos(this.cannonAngle) * 100, (this.canvas.height - 50) + Math.sin(this.cannonAngle) * 100);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Score
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#555';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
    }

    drawBubble(x, y, style, radiusOverride = null) {
        const r = radiusOverride || this.radius;
        this.ctx.transform(1, 0, 0, 1, x, y);

        // Body
        this.ctx.fillStyle = style.c;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r - 2, 0, Math.PI * 2); // -2 gap
        this.ctx.fill();

        // Shine
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
        this.ctx.beginPath();
        this.ctx.arc(-r * 0.3, -r * 0.3, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();

        // Face
        if (!radiusOverride) { // Don't draw face on tiny preview
            this.ctx.fillStyle = '#555';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(style.f, 0, 0);
        }

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // ... Save Highscore Logic Placeholder ...
    saveHighscore(name) {
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-pop-leaderboard') || '[]');
        } catch (e) { }
        leaderboard.push({ name: name, score: this.score, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('puff-pop-leaderboard', JSON.stringify(leaderboard));
    }
}
