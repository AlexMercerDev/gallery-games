export class SlashEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.lastTime = 0;
        this.timeScale = 1.0; // 1.0 = normal, 0.1 = slow-mo
        this.targetTimeScale = 1.0;

        this.state = {
            player: { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0, radius: 15, isDashing: false },
            enemies: [], // { x, y, vx, vy, type }
            particles: [],
            score: 0,
            isGameOver: false,
            slashLine: null // { start: {x,y}, end: {x,y} }
        };

        // Systems
        // this.renderer = new SlashRenderer
        // this.input = new InputSystem
        // this.spawner = new EnemySpawner

        this.isRunning = false;

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((ts) => this.loop(ts));
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const rawDt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Smoothly interpolate time scale
        this.timeScale += (this.targetTimeScale - this.timeScale) * 0.2;

        // Scaled Delta Time
        const dt = rawDt * this.timeScale;

        this.update(dt, rawDt); // Pass rawDt for UI/Rendering unrelated to game time
        this.render();

        requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt, rawDt) {
        if (this.state.isGameOver) return;

        // Update Player
        const { player } = this.state;
        player.x += player.vx * dt;
        player.y += player.vy * dt;

        // Friction / Drag
        player.vx *= 0.95;
        player.vy *= 0.95;

        // Boundaries
        if (player.x < 0) player.x = 0;
        if (player.x > this.canvas.width) player.x = this.canvas.width;
        if (player.y < 0) player.y = 0;
        if (player.y > this.canvas.height) player.y = this.canvas.height;
    }

    render() {
        this.ctx.fillStyle = '#110011'; // Dark Purple BG
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Debug Player
        this.ctx.fillStyle = '#00ffcc';
        this.ctx.beginPath();
        this.ctx.arc(this.state.player.x, this.state.player.y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Debug UI
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`Time: ${this.timeScale.toFixed(2)}`, 10, 20);
    }
}
