export class OrbitEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.hasStarted = false;
        this.score = 0;
        this.isGameOver = false;

        // Player
        this.player = {
            x: 0, y: 0,
            radius: 12,
            angle: 0, // Orbit angle
            orbitRadius: 0, // Distance from center
            planet: null, // Current planet
            vx: 0, vy: 0,
            state: 'orbit', // 'orbit' or 'fly'
            rotDir: 1 // 1 or -1
        };

        // World
        this.planets = [];
        this.stars = [];
        this.cameraY = 0;

        // Juice
        this.shake = 0;
        this.trails = []; // {x, y, life}
        this.collectibles = []; // {x, y, r, collected}
        this.asteroids = []; // {planetIndex, angle, dist, speed, r}

        // Skins
        this.skins = [
            { name: 'Classic', color: '#FFFFFF', visor: '#00B0FF' },
            { name: 'Red', color: '#FF5252', visor: '#D32F2F' },
            { name: 'Green', color: '#69F0AE', visor: '#00C853' },
            { name: 'Purple', color: '#E040FB', visor: '#AA00FF' },
            { name: 'Orange', color: '#FFAB40', visor: '#FF6D00' },
            { name: 'Pink', color: '#FF4081', visor: '#F50057' }
        ];
        this.currentSkin = parseInt(localStorage.getItem('puff-orbit-skin')) || 0;

        this.centerX = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        const inputAction = (e) => {
            if (this.isGameOver) return;
            e.preventDefault();
            this.onTap();
        };
        document.addEventListener('mousedown', inputAction);
        document.addEventListener('touchstart', inputAction, { passive: false });
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
        this.planets = [];
        this.stars = [];
        this.trails = [];
        this.collectibles = [];
        this.asteroids = [];
        this.cameraY = 0;

        // Initial Planet
        const startPlanet = {
            x: this.centerX,
            y: this.canvas.height - 150,
            radius: 50,
            color: '#4FC3F7',
            type: 'start'
        };
        this.planets.push(startPlanet);

        // Player on start planet
        this.player.planet = startPlanet;
        this.player.state = 'orbit';
        this.player.angle = -Math.PI / 2;
        this.player.orbitRadius = startPlanet.radius + 20;
        this.player.rotDir = 1;
        this.player.vx = 0;
        this.player.vy = 0;

        // Generate more planets
        for (let i = 0; i < 5; i++) {
            this.spawnPlanet(this.planets[this.planets.length - 1].y - 250);
        }

        // Stars
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                alpha: Math.random()
            });
        }
    }

    spawnPlanet(y) {
        // Constrain to center column
        const spread = 300; // Total width 600
        const x = this.centerX + (Math.random() - 0.5) * spread;
        const radius = 30 + Math.random() * 30;

        const hues = [200, 280, 160, 340, 40]; // Blue, Purple, Green, Pink, Added Gold/Orange
        const hue = hues[Math.floor(Math.random() * hues.length)];

        const planet = {
            x: x,
            y: y,
            radius: radius,
            color: `hsl(${hue}, 70%, 60%)`,
            visited: false
        };
        this.planets.push(planet);

        // Spawn Coins?
        if (Math.random() > 0.3) {
            this.collectibles.push({
                x: x + (Math.random() - 0.5) * 100,
                y: y + (Math.random() - 0.5) * 100 - 150, // Between planets
                r: 10,
                collected: false
            });
        }

        // Spawn Asteroid?
        if (this.score > 5 && Math.random() > 0.5) {
            this.asteroids.push({
                planet: planet,
                angle: Math.random() * Math.PI * 2,
                dist: radius + 40 + Math.random() * 40,
                speed: (Math.random() + 0.5) * 0.03 * (Math.random() > 0.5 ? 1 : -1),
                r: 8
            });
        }
    }

    onTap() {
        if (!this.hasStarted) {
            this.hasStarted = true;
            if (this.onStart) this.onStart();
        }

        if (this.player.state === 'orbit') {
            this.launch();
        }
    }

    launch() {
        this.player.state = 'fly';
        const p = this.player;

        // Tangent Velocity
        // Tangent is perpendicular to radius vector
        // Vx = -sin(angle), Vy = cos(angle) if CCW?
        // Let's verify:
        // Angle 0 (Right): Radius (1,0). Tangent (0,1) Down? Correct.
        // Rotation Direction matters.

        const speed = 8;

        // Tangent direction
        const tx = -Math.sin(p.angle);
        const ty = Math.cos(p.angle);

        p.vx = tx * speed * p.rotDir;
        p.vy = ty * speed * p.rotDir;

        // Add current radius vector to x,y just to be sure we are exactly where we drew
        p.x = p.planet.x + Math.cos(p.angle) * p.orbitRadius;
        p.y = p.planet.y + Math.sin(p.angle) * p.orbitRadius;

        p.planet = null;

        // Juice
        this.shake = 2;
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

        if (this.shake > 0) this.shake *= 0.9;

        // Camera (Smooth follow player Y)
        // Aim to keep player at 3/4 screen height
        const targetCamY = -this.player.y + this.canvas.height * 0.75;
        // Don't go down
        if (targetCamY > this.cameraY) {
            this.cameraY += (targetCamY - this.cameraY) * 0.1;
        }

        // Update Asteroids
        for (let a of this.asteroids) {
            a.angle += a.speed;
            a.x = a.planet.x + Math.cos(a.angle) * a.dist;
            a.y = a.planet.y + Math.sin(a.angle) * a.dist;
        }

        if (!this.hasStarted) return;

        const p = this.player;

        // Collision with Asteroids (Always active)
        for (let a of this.asteroids) {
            const dx = p.x - a.x;
            const dy = p.y - a.y;
            if (dx * dx + dy * dy < (p.radius + a.r) ** 2) {
                this.triggerGameOver();
                return;
            }
        }

        // Logic
        if (p.state === 'orbit') {
            const orbitSpeed = 0.05 + (this.score * 0.002);
            p.angle += orbitSpeed * p.rotDir;

            p.x = p.planet.x + Math.cos(p.angle) * p.orbitRadius;
            p.y = p.planet.y + Math.sin(p.angle) * p.orbitRadius;
        } else {
            // Fly
            p.x += p.vx;
            p.y += p.vy;

            // Collectibles
            for (let c of this.collectibles) {
                if (!c.collected) {
                    const dx = p.x - c.x;
                    const dy = p.y - c.y;
                    if (dx * dx + dy * dy < (p.radius + c.r + 10) ** 2) { // Magnet
                        c.collected = true;
                        this.score++; // Bonus score!
                        this.shake = 1;
                    }
                }
            }

            // Trail
            if (this.score > 0 && Math.random() > 0.5) { // Only trail after start
                this.trails.push({ x: p.x, y: p.y, life: 20 });
            }

            // Check Collision with Planets
            for (let planet of this.planets) {
                if (planet === p.planet) continue; // Should be null anyway

                const dx = p.x - planet.x;
                const dy = p.y - planet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Capture Radius: Planet Radius + Player Radius + Tolerance
                const captureDist = planet.radius + p.radius + 15; // More forgiving

                if (dist < captureDist) {
                    // Capture!
                    p.state = 'orbit';
                    p.planet = planet;
                    p.orbitRadius = dist; // Keep current distance magnitude
                    p.angle = Math.atan2(dy, dx);

                    // Determine rotation direction
                    // Cross product of velocity and radius vector
                    // V = (vx, vy), R = (dx, dy)
                    // Cross = vx*dy - vy*dx
                    const cross = p.vx * dy - p.vy * dx;
                    p.rotDir = cross > 0 ? 1 : -1;

                    p.vx = 0; p.vy = 0;

                    if (!planet.visited) {
                        planet.visited = true;
                        this.score++;
                        // Spawn new planet ahead
                        this.spawnPlanet(this.planets[this.planets.length - 1].y - 200 - Math.random() * 100);

                        // Cleanup old planets
                        if (this.planets.length > 8) {
                            const rem = this.planets.shift();
                            // Remove associated asteroids/coins
                            this.asteroids = this.asteroids.filter(a => a.planet !== rem);
                            this.collectibles = this.collectibles.filter(c => c.y > rem.y - 200); // Remove collectibles below a certain point
                        }
                    }

                    this.shake = 5; // Snap impact
                    break;
                }
            }

            // Fail Check
            // Too low (below camera)
            if (p.y > -this.cameraY + this.canvas.height + 100) {
                this.triggerGameOver();
            }
            // Side bounds
            if (p.x < this.centerX - 400 || p.x > this.centerX + 400) { // Bounds relative to center
                this.triggerGameOver();
            }
        }

        // Update Trails
        for (let i = this.trails.length - 1; i >= 0; i--) {
            this.trails[i].life--;
            if (this.trails[i].life <= 0) this.trails.splice(i, 1);
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;

        // Leaderboard
        let leaderboard = [];
        try {
            leaderboard = JSON.parse(localStorage.getItem('puff-orbit-leaderboard') || '[]');
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
            leaderboard = JSON.parse(localStorage.getItem('puff-orbit-leaderboard') || '[]');
        } catch (e) { }
        leaderboard.push({ name: name, score: this.score, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('puff-orbit-leaderboard', JSON.stringify(leaderboard));
    }

    render() {
        this.ctx.fillStyle = '#050010';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Shake
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        this.ctx.translate(0, this.cameraY);

        // Stars (Background)
        // Parallax: Move slightly opposite to camera
        for (let s of this.stars) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            // Wrap Y
            let sy = (s.y - this.cameraY * 0.2) % this.canvas.height;
            if (sy < 0) sy += this.canvas.height;

            this.ctx.beginPath();
            this.ctx.arc(s.x, sy - (this.cameraY * 0.8), s.size, 0, Math.PI * 2); // Adjust logic for scrolling
            // Simpler: Just map to screen space?
            // Let's just draw them relative to world but wrap
            this.ctx.fill();
        }

        // Trails
        for (let t of this.trails) {
            this.ctx.fillStyle = `rgba(0, 176, 255, ${t.life / 20})`; // Cyan trail
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Planets
        for (let planet of this.planets) {
            // Glow
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = planet.color;
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Rings?
            this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius + 15, 0, Math.PI * 2);
            this.ctx.stroke();

            if (planet.visited) {
                this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
                this.ctx.beginPath();
                this.ctx.arc(planet.x, planet.y, 5, 0, Math.PI * 2); // Center dot
                this.ctx.fill();
            }
        }

        // Asteroids
        this.ctx.fillStyle = '#9E9E9E';
        for (let a of this.asteroids) {
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Collectibles
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#FFD700';
        this.ctx.fillStyle = '#FFD700';
        for (let c of this.collectibles) {
            if (!c.collected) {
                this.ctx.beginPath();
                this.ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.shadowBlur = 0;

        // Player
        const p = this.player;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.angle); // Rotate with orbit?

        // Puff Body
        const skinColor = this.skins[this.currentSkin].color;
        const visorColor = this.skins[this.currentSkin].visor;
        
        this.ctx.fillStyle = skinColor;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = visorColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Helmet Visor
        this.ctx.fillStyle = visorColor;
        this.ctx.beginPath();
        this.ctx.ellipse(2, -2, 8, 5, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Reflection
        this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
        this.ctx.beginPath();
        this.ctx.arc(4, -4, 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();

        this.ctx.restore(); // End Camera

        // HUD
        this.ctx.fillStyle = '#E1F5FE';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
    }

    nextSkin() {
        this.currentSkin = (this.currentSkin + 1) % this.skins.length;
        localStorage.setItem('puff-orbit-skin', this.currentSkin);
    }
}
