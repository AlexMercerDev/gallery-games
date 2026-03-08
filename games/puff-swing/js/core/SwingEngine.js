export class SwingEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.hasStarted = false;
        this.score = 0;
        this.isGameOver = false;

        // Physics
        // Physics
        this.gravity = 0.45; // Slightly heavier again (was 0.4)
        this.drag = 0.999;
        this.reach = 450; // Increased to 450 (was 350) to allow easier climbing

        // Player
        this.player = {
            x: 0, y: 0,
            radius: 15,
            vx: 0, vy: 0
        };

        // World
        this.anchors = [];
        this.lavaY = 0;
        this.lavaSpeed = 1;
        this.cameraY = 0;
        this.highestY = 0; // Inverted (lower is higher)

        // Rope
        this.rope = {
            active: false,
            anchor: null,
            length: 0
        };

        // Juice
        this.shake = 0;
        this.particles = []; // { x, y, vx, vy, life, color, size }
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.clouds = [];
        for (let i = 0; i < 20; i++) this.addCloud();

        // Input
        // Hold to Swing, Release to Fly
        const startInput = (e) => {
            if (this.isGameOver) return;
            e.preventDefault();
            this.inputActive = true;
            this.tryGrapple();
            if (!this.hasStarted) {
                this.hasStarted = true;
                if (this.onStart) this.onStart();
            }
        };

        const endInput = (e) => {
            this.inputActive = false;
            this.releaseGrapple();
        };

        document.addEventListener('mousedown', startInput);
        document.addEventListener('touchstart', startInput, { passive: false });

        document.addEventListener('mouseup', endInput);
        document.addEventListener('touchend', endInput);

        document.addEventListener('keydown', e => {
            if (e.code === 'Space') startInput(e);
        });
        document.addEventListener('keyup', e => {
            if (e.code === 'Space') endInput(e);
        });

        this.reset();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;
        this.hasStarted = false;
        this.anchors = [];
        this.cameraY = 0;

        // Player start
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 200;
        this.player.vx = 0;
        this.player.vy = 0;

        this.highestY = this.player.y;
        this.lavaY = this.canvas.height + 200; // Give more head start
        this.lavaSpeed = 0.3; // Slower lava (was 0.5)

        this.rope.active = false;
        this.rope.anchor = null;
        this.lastAnchor = null; // Track last anchor to prevent re-grab

        // Initial Anchors
        this.anchors.push({ x: this.canvas.width / 2, y: this.player.y - 150 });
        this.generateAnchors(this.player.y - 300);
    }

    generateAnchors(targetY) {
        // Fill up to targetY
        let lastY = this.anchors.length > 0 ? this.anchors[this.anchors.length - 1].y : this.canvas.height;
        let lastX = this.anchors.length > 0 ? this.anchors[this.anchors.length - 1].x : this.canvas.width / 2;

        let y = lastY;

        while (y > targetY) {
            // Vertical Step (Keep it reachable, max 250)
            const stepY = 100 + Math.random() * 150;
            y -= stepY;

            // Horizontal Step (Constrained by Reach)
            // Reach is 450. Be conservative with 400 for generation
            const maxReachGen = 400;
            const maxDx = Math.sqrt(maxReachGen * maxReachGen - stepY * stepY);

            // Random direction
            const dir = Math.random() > 0.5 ? 1 : -1;
            let dx = (Math.random() * maxDx);

            // Bias towards center if too close to edge
            if (lastX < 200) dx = Math.abs(dx);
            if (lastX > this.canvas.width - 200) dx = -Math.abs(dx);

            let x = lastX + (dx * dir);

            // Hard Clamp
            x = Math.max(50, Math.min(this.canvas.width - 50, x));

            this.anchors.push({ x, y, w: 40 + Math.random() * 30 }); // Width for island

            lastX = x;

            // Add cloud occasionally
            if (Math.random() < 0.3) this.addCloud(y - 500);
        }
    }

    addCloud(yOverride) {
        this.clouds.push({
            x: Math.random() * this.canvas.width,
            y: yOverride || Math.random() * this.canvas.height,
            size: 30 + Math.random() * 50,
            speed: (Math.random() + 0.1) * 0.5
        });
    }

    spawnParticles(x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    }

    tryGrapple() {
        // Find nearest anchor above player?
        // Actually nearest distance
        let nearest = null;
        let minDist = this.reach; // Use new reach constant

        for (let a of this.anchors) {
            // Skip last anchor (unless it's the only one/emergency? No, force progress)
            if (a === this.lastAnchor) continue;

            const dx = a.x - this.player.x;
            const dy = a.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Constraint: Must be somewhat ABOVE the player?
            // If we allow grabbing below, it's a safety net.
            // Let's enforce: Anchor.y < Player.y + 50 (Can grab slightly below, but mostly up)
            if (dist < minDist && a.y < this.player.y + 100) {
                minDist = dist;
                nearest = a;
            }
        }

        if (nearest) {
            this.rope.active = true;
            this.rope.anchor = nearest;
            this.rope.length = minDist;
            this.player.color = '#FFFF00'; // Feedback: Turn yellow
            this.lastAnchor = nearest; // Mark as used
            
            // Spawn particles on grab
            this.spawnParticles(nearest.x, nearest.y, '#795548', 8);
            this.shake = 3;
        } else {
            this.player.color = '#CCCCCC'; // Feedback: Grey (Miss)
        }
    }

    releaseGrapple() {
        if (this.rope.active) {
            this.rope.active = false;
            this.player.vy -= 4; // STRONGER JUMP BOOST
            this.player.color = '#FFFFFF'; // Reset color
            
            // Spawn particles on release
            this.spawnParticles(this.player.x, this.player.y, '#FFF', 10);
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
            p.life -= 0.025;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Cloud movement
        for (let c of this.clouds) {
            c.x += c.speed;
            if (c.x > this.canvas.width + 100) c.x = -100;
        }

        if (!this.hasStarted) return;

        const p = this.player;

        // Physics
        p.vy += this.gravity;
        p.vx *= this.drag;
        p.vy *= this.drag;

        // Rope Constraint
        if (this.rope.active) {
            const a = this.rope.anchor;
            const dx = p.x - a.x;
            const dy = p.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.rope.length) {
                // Correct position
                const angle = Math.atan2(dy, dx);
                p.x = a.x + Math.cos(angle) * this.rope.length;
                p.y = a.y + Math.sin(angle) * this.rope.length;

                // Correct velocity (Remove Component parallel to rope)
                // We want velocity to be tangent
                // Radial vector (normalized)
                const rx = dx / dist;
                const ry = dy / dist;

                // Dot product of Velocity and Radial
                const dot = p.vx * rx + p.vy * ry;

                // Remove radial component
                p.vx -= dot * rx;
                p.vy -= dot * ry;

                // Add Swing Force (Gravity makes it swing, but maybe add input force for juice)
                // Actually gravity handles it if strict position constraint exists.
                // But simple damping kills swing.
                // We might need to artificially conserve energy or add speed.

                // General Momentum Preservation
                p.vx *= 1.0; // No drag on rope to keep momentum
                p.vy *= 1.0;

                // Reel In (Climb!)
                if (this.rope.length > 50) {
                    this.rope.length -= 1.0; // Moderate pull
                }
            } else {
                // Determine rope length? Slack rope?
                // Usually grappling hook implies taut rope immediately or reeling in?
                // Let's assume fixed length once attached? Or Allow reeling in?
                // "Spider-Man 2" physics: Rope is loose until taut.
                // Let's go with: Rope ensures max distance.
            }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wall Bounce
        if (p.x < p.radius) {
            p.x = p.radius;
            p.vx *= -0.8;
        }
        if (p.x > this.canvas.width - p.radius) {
            p.x = this.canvas.width - p.radius;
            p.vx *= -0.8;
        }

        // Lava
        this.lavaY -= this.lavaSpeed;
        this.lavaSpeed = 0.5 + (this.score / 1000); // Speed up slowly

        if (p.y > this.lavaY - p.radius) {
            this.triggerGameOver();
        }

        // Score & Camera
        if (p.y < this.highestY) {
            this.highestY = p.y;
            // Initial Y is Height - 200.
            // Score = (Initial - Current) / 10?
            this.score = (this.canvas.height - 200 - this.highestY) / 10;
            if (this.score < 0) this.score = 0;

            this.generateAnchors(p.y - 500);
        }

        // Camera Follow
        const targetCamY = -p.y + this.canvas.height * 0.6;
        if (targetCamY > this.cameraY) { // Only move up
            this.cameraY += (targetCamY - this.cameraY) * 0.1;
        }

        // Don't let camera see below lava
        // actually lava rises in world space.

        // Remove old anchors
        if (this.anchors.length > 20) {
            // Cleanup anchors below screen
            // ...
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;

        // Leaderboard
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-swing-leaderboard') || '[]');
        } catch (e) { }

        let isNew = false;
        if (leaderboard.length < 5 || this.score > leaderboard[leaderboard.length - 1].score) {
            isNew = true;
        }

        if (this.onGameOver) this.onGameOver(Math.floor(this.score), isNew, leaderboard);
    }

    saveHighscore(name) {
        // Server Save
        fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: 'puff-swing',
                name: name,
                score: Math.floor(this.score)
            })
        }).catch(e => console.error("Score Save Failed", e));

        // Local Fallback (Keep for offline)
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-swing-leaderboard') || '[]');
        } catch (e) { }
        leaderboard.push({ name: name, score: Math.floor(this.score), date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('puff-swing-leaderboard', JSON.stringify(leaderboard));
    }

    render() {
        // Sky Gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#4FC3F7');
        gradient.addColorStop(1, '#E1F5FE');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(0, this.cameraY);

        // Clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let c of this.clouds) {
            // Simple Cloud
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            this.ctx.arc(c.x + c.size * 0.7, c.y + c.size * 0.2, c.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(c.x - c.size * 0.7, c.y + c.size * 0.2, c.size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
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

        // Lava
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(0, this.lavaY, this.canvas.width, this.canvas.height + this.cameraY + 500); // Extend down
        // Bubbles on lava?

        // Find nearest for visualization
        let nearest = null;
        let minDist = this.reach;
        if (!this.rope.active) {
            for (let a of this.anchors) {
                if (a === this.lastAnchor) continue; // Don't highlight used anchor
                const dx = a.x - this.player.x;
                const dy = a.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist && a.y < this.player.y + 100) {
                    minDist = dist;
                    nearest = a;
                }
            }
        }

        // Rope
        if (this.rope.active) {
            this.ctx.strokeStyle = '#795548'; // Rope color
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x, this.player.y);
            this.ctx.lineTo(this.rope.anchor.x, this.rope.anchor.y);
            this.ctx.stroke();
        }

        // Anchors (Floating Islands)
        for (let a of this.anchors) {
            // Cull offscreen
            if (a.y > -this.cameraY + this.canvas.height + 100) continue;

            const w = a.w || 40;

            // Dirt Bottom
            this.ctx.fillStyle = '#795548';
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, w / 2, 0, Math.PI, false); // Bottom half
            this.ctx.fill();

            // Grass Top
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y - 2, w / 2, Math.PI, 0, false); // Top half
            this.ctx.fill();

            // Anchor Point
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw Target Ring
            // Draw Target Ring & Line
            if (a === nearest) {
                // Reticle
                this.ctx.strokeStyle = '#FFF';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(a.x, a.y, 20 + Math.sin(Date.now() / 100) * 2, 0, Math.PI * 2); // Pulse
                this.ctx.stroke();

                // Outline for visibility
                this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                // Dash line to player
                this.ctx.strokeStyle = '#FFF';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.x, this.player.y);
                this.ctx.lineTo(a.x, a.y);
                this.ctx.stroke();

                this.ctx.setLineDash([]);
            }
        }

        // Player
        this.ctx.fillStyle = '#FFF'; // Puff
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw Face using common method
        const isScared = (this.lavaY - this.player.y < 400);
        let expression = 'normal';
        if (isScared) expression = 'shock';
        if (this.player.vy < -3) expression = 'jump';

        this.drawFace(this.player.x, this.player.y, this.player.radius, expression);

        this.ctx.restore();

        // HUD
        this.ctx.save();
        this.ctx.fillStyle = '#FFF';
        this.ctx.shadowColor = '#4CAF50';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.font = 'italic 900 40px "Arial Black", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${Math.floor(this.score)}m`, 20, 50);

        // DEBUG TEXT
        // this.ctx.font = '20px sans-serif';
        // this.ctx.fillText(`Input: ${this.inputActive}`, 20, 100);

        this.ctx.restore();

        // Lava Warning (Keep Red)
        const distToLava = this.lavaY - this.player.y;
        if (distToLava < 300) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${1 - (distToLava / 300)})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'italic 900 30px "Arial Black", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("CLIMB FASTER!", this.canvas.width / 2, this.canvas.height - 100);
        }
    }

    drawFace(x, y, r, expression) {
        this.ctx.fillStyle = '#111';
        this.ctx.strokeStyle = '#111';
        this.ctx.lineWidth = 2;

        // Eye positions
        const eyeOffX = r * 0.35;
        const eyeOffY = -r * 0.1;
        const eyeSize = r * 0.15;

        if (expression === 'jump') {
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
            // Normal ^ ^ (Happy)
            this.ctx.lineWidth = 3;
            this.ctx.beginPath(); this.ctx.arc(x - eyeOffX, y + eyeOffY, eyeSize, Math.PI, 0); this.ctx.stroke(); // Left ^
            this.ctx.beginPath(); this.ctx.arc(x + eyeOffX, y + eyeOffY, eyeSize, Math.PI, 0); this.ctx.stroke(); // Right ^
            this.ctx.lineWidth = 2; // Reset

            // Mouth (Smile)
            this.ctx.beginPath(); this.ctx.arc(x, y + r * 0.1, r * 0.4, 0.2 * Math.PI, 0.8 * Math.PI); this.ctx.stroke();
        }

        // Cheeks
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
        this.ctx.beginPath(); this.ctx.arc(x - r * 0.5, y + r * 0.2, r * 0.15, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.arc(x + r * 0.5, y + r * 0.2, r * 0.15, 0, Math.PI * 2); this.ctx.fill();
    }
}
