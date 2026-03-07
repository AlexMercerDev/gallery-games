import { PUFF_TYPES } from '../data/PuffTypes.js';

export class PuffEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.bodies = []; // { x, y, vx, vy, radius, tier, id, type }
        this.gravity = 0.5;
        this.friction = 0.98;
        this.wallBounciness = 0.3;

        this.nextPuffTier = 0;
        this.mouse = { x: canvas.width / 2, y: 50 };

        this.score = 0;
        this.highscore = parseInt(localStorage.getItem('puff-merge-highscore')) || 0;
        this.isGameOver = false;
        this.overflowTimer = 0;

        this.isRunning = false;

        // Input
        canvas.addEventListener('mousemove', e => this.onMove(e));
        canvas.addEventListener('mouseup', e => this.onClick(e));
        canvas.addEventListener('touchmove', e => { e.preventDefault(); this.onMove(e.touches[0]); }, { passive: false });
        canvas.addEventListener('touchend', e => { e.preventDefault(); this.onClick(); }, { passive: false });

        window.addEventListener('resize', () => this.resize());
        this.resize();

        this.imgCache = {}; // Cache rendered faces if needed
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.floorY = this.canvas.height - 20;

        // Constrain width for wide monitors (Max 600px container)
        const MAX_GAME_WIDTH = 600;
        if (this.canvas.width > MAX_GAME_WIDTH) {
            const margin = (this.canvas.width - MAX_GAME_WIDTH) / 2;
            this.wallL = margin;
            this.wallR = this.canvas.width - margin;
        } else {
            this.wallL = 20;
            this.wallR = this.canvas.width - 20;
        }
    }

    onMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX || e.pageX) - rect.left;
        // Clamp
        this.mouse.x = Math.max(this.wallL + 20, Math.min(this.mouse.x, this.wallR - 20));
    }

    onClick() {
        if (this.isGameOver) return; // Handled by UI now

        // Spawn Puff at mouse x
        this.spawnPuff(this.mouse.x, 50, this.nextPuffTier);

        // Randomize next (0 or 1)
        this.nextPuffTier = Math.floor(Math.random() * 2);
    }

    reset() {
        this.bodies = [];
        this.score = 0;
        this.isGameOver = false;
        this.overflowTimer = 0;
        this.nextPuffTier = 0;
    }

    spawnPuff(x, y, tier) {
        const type = PUFF_TYPES[tier];
        this.bodies.push({
            x, y,
            vx: 0, vy: 0,
            radius: type.radius,
            tier: tier,
            type: type,
            type: type,
            id: Math.random(), // Unique ID
            age: 0 // Track frames alive to prevent instant game over
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

        const dt = 1; // Fixed step for simplicity implementation
        const subSteps = 8; // Iterate collision resolution for stability

        // Apply Gravity & Velocity
        for (let b of this.bodies) {
            b.vy += this.gravity;
            b.vx *= this.friction;
            b.vy *= this.friction;

            b.x += b.vx;
            b.y += b.vy;
            b.age++; // Increment age
        }

        // Resolve Constraints (Substeps)
        for (let s = 0; s < subSteps; s++) {
            this.resolveCollisions();
            this.resolveWalls();
        }

        // Game Over Check
        // Check if any body is above the line (y < 100) and relatively stable
        let isOverflowing = false;
        const LINE_Y = 100;

        for (let b of this.bodies) {
            // Check if top of ball is above line? Or Center? Let's use Center for forgiveness, or Top for strictness.
            // Using Center (b.y) < LINE_Y.
            // Velocity threshold raised to 0.5 to catch "jittering" but stuck balls.
            // FIX: Ignore young bodies (just spawned) to prevent false positives while falling.
            if (b.age > 100 && b.y < LINE_Y && Math.abs(b.vy) < 0.5 && Math.abs(b.vx) < 0.5) {
                isOverflowing = true;
                // console.log(`Overflow detected! Body ID: ${b.id}, Age: ${b.age}, Y: ${b.y}, Vy: ${b.vy}`);
                break;
            }
        }

        if (isOverflowing) {
            this.overflowTimer += dt;
            // Reduce time to 1 second (approx 60 frames)
            if (this.overflowTimer > 60) {
                this.triggerGameOver();
            }
        } else {
            // Decay timer instead of hard reset? No, hard reset is fairer for recovery.
            this.overflowTimer = 0;
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;

        // Check if Highscore (Top 5)
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-merge-leaderboard') || '[]');
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
            leaderboard = JSON.parse(localStorage.getItem('puff-merge-leaderboard') || '[]');
        } catch (e) { }

        // Add new entry
        leaderboard.push({ name: name, score: this.score, date: new Date().toISOString() });

        // Sort and Keep Top 5
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);

        // Save back
        localStorage.setItem('puff-merge-leaderboard', JSON.stringify(leaderboard));

        // Backward compat
        this.highscore = leaderboard[0].score;
        localStorage.setItem('puff-merge-highscore', this.highscore);
    }

    resolveWalls() {
        for (let b of this.bodies) {
            // Floor
            if (b.y + b.radius > this.floorY) {
                b.y = this.floorY - b.radius;
                b.vy *= -this.wallBounciness;
            }
            // Walls
            if (b.x - b.radius < this.wallL) {
                b.x = this.wallL + b.radius;
                b.vx *= -this.wallBounciness;
            }
            if (b.x + b.radius > this.wallR) {
                b.x = this.wallR - b.radius;
                b.vx *= -this.wallBounciness;
            }
        }
    }

    resolveCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const b1 = this.bodies[i];
                const b2 = this.bodies[j];

                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                const minDist = b1.radius + b2.radius;

                if (dist < minDist) {
                    // Overlap

                    // MERGE LOGIC
                    if (b1.tier === b2.tier && b1.tier < PUFF_TYPES.length - 1) {
                        // Merge!
                        this.merge(i, j);
                        return; // Re-evaluate next frame/step to avoid index issues
                    }

                    // Physics Resolution (Push apart)
                    const overlap = minDist - dist;
                    const nx = dx / dist; // Normal
                    const ny = dy / dist;

                    // Relative velocity?
                    // Simple positional correction (Verlet-ish)
                    // Move apart proportional to mass? Assuming equal density, mass ~ radius^2 or just radius.
                    const totalR = b1.radius + b2.radius;
                    const r1 = b2.radius / totalR; // Ratio for b1 movement
                    const r2 = b1.radius / totalR;

                    // Separate
                    const force = 0.5 * overlap; // Stiffness

                    b1.x -= nx * force * r1;
                    b1.y -= ny * force * r1;
                    b2.x += nx * force * r2;
                    b2.y += ny * force * r2;

                    // Impulse Exchange (Elastic)
                    // Simplified: Exchange velocities along normal
                    // ... For stacking, positional correction is often enough + gravity
                    // Add slight friction between balls?

                }
            }
        }
    }

    merge(idx1, idx2) {
        const b1 = this.bodies[idx1];
        const b2 = this.bodies[idx2];

        const newX = (b1.x + b2.x) / 2;
        const newY = (b1.y + b2.y) / 2;
        const newTier = b1.tier + 1;

        // Remove old
        // Sort indices to remove higher first
        if (idx1 > idx2) {
            this.bodies.splice(idx1, 1);
            this.bodies.splice(idx2, 1);
        } else {
            this.bodies.splice(idx2, 1);
            this.bodies.splice(idx1, 1);
        }

        // Add new
        this.spawnPuff(newX, newY, newTier);
        this.score += (newTier + 1) * 10;

        // TODO: Particle effects
    }

    render() {
        // Clear
        this.ctx.fillStyle = '#FDF6E3'; // Cream/Paper white
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Container
        this.ctx.strokeStyle = '#D3C6AA';
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(this.wallL, -50, this.wallR - this.wallL, this.floorY + 50);

        // Target Line
        this.ctx.strokeStyle = '#FFCCCB';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.wallL, 100);
        this.ctx.lineTo(this.wallR, 100);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Bodies
        for (let b of this.bodies) {
            this.drawPuff(b);
        }

        // Next Puff preview at mouse
        if (!this.isGameOver) {
            const nextType = PUFF_TYPES[this.nextPuffTier];
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillStyle = nextType.color;
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, 50, nextType.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;

            // Guide Line
            this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x, 50);
            this.ctx.lineTo(this.mouse.x, this.floorY);
            this.ctx.stroke();
        }

        // Score
        this.ctx.fillStyle = '#8E7F7F';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 40, 50);
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText(`Best: ${this.highscore}`, 40, 80);

        // Overflow Warning
        // FIX: Display threshold increased to 15 frames (0.25s) to prevent flickering on spawn
        if (this.overflowTimer > 15) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(0.5, (this.overflowTimer - 15) / 45)})`;
            this.ctx.fillRect(0, 0, this.canvas.width, 150);
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("DANGER!", this.canvas.width / 2, 100);
        }

        // Game Over Overlay
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(253, 246, 227, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawPuff(b) {
        this.ctx.fillStyle = b.type.color;
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Face
        this.ctx.fillStyle = '#6B5B5B'; // Soft brown text
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(b.type.face, b.x, b.y);

        // Shine/Glow
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
        this.ctx.beginPath();
        this.ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }
}
