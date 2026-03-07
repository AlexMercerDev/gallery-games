import { GameState } from '../state/GameState.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { Renderer } from '../view/Renderer.js';
import { InputManager } from '../input/InputManager.js';

export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.timeStep = 1000 / 60; // 60 FPS fixed time step

        // Initialize State
        this.state = new GameState();
        this.state.player.screenWidth = canvas.width;
        // Mock Anchors for testing
        this.state.anchors = [
            { id: 1, x: canvas.width / 2, y: canvas.height - 200, radius: 20 },
            { id: 2, x: canvas.width / 2 + 100, y: canvas.height - 400, radius: 20 },
            { id: 3, x: canvas.width / 2 - 100, y: canvas.height - 600, radius: 20 }
        ];
        // Set player to start at first anchor
        this.state.player.x = this.state.anchors[0].x;
        this.state.player.y = this.state.anchors[0].y;
        this.state.player.isAnchored = true;
        this.state.player.anchorId = 1;

        // Initialize Systems
        this.physics = new PhysicsSystem(this.state);
        this.renderer = new Renderer(canvas, this.ctx);
        this.input = new InputManager(canvas, this.state);

        this.isRunning = false;
        this.animationFrameId = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.state.player.screenWidth = this.canvas.width;
        this.renderer.resize(this.canvas.width, this.canvas.height);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((ts) => this.loop(ts));
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationFrameId);
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.accumulatedTime += deltaTime;

        // Limiting accumulated time to prevent spiral of death
        if (this.accumulatedTime > 1000) this.accumulatedTime = 1000;

        // Fixed Update (Logic/Physics)
        while (this.accumulatedTime >= this.timeStep) {
            this.update(this.timeStep);
            this.accumulatedTime -= this.timeStep;
        }

        // Variable Update (Rendering)
        const alpha = this.accumulatedTime / this.timeStep;
        this.render(alpha);

        this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt) {
        if (this.state.requestRestart) {
            this.state.reset();
            // Reset to intro anchor
            this.state.player.x = this.state.anchors[0].x;
            this.state.player.y = this.state.anchors[0].y;
            this.state.player.isAnchored = true;
            this.state.player.anchorId = 1;

            // Reset Void
            this.state.voidLineY = this.canvas.height + 200;

            this.state.requestRestart = false;
        }

        if (!this.state.player.isDead) {
            this.physics.update(dt);

            // Move Void Up (decrease Y)
            // Speed increases with score?
            const voidSpeed = 0.05 + (this.state.score * 0.0001);
            this.state.voidLineY -= voidSpeed * dt;

            // Check Death
            if (this.state.player.y > this.state.voidLineY) {
                this.state.player.isDead = true;
            }
        }
    }

    render(alpha) {
        this.renderer.render(this.state, alpha);

        // Debug FPS
        // this.ctx.fillStyle = 'white';
        // this.ctx.fillText('FPS: ' + (1000 / this.timeStep).toFixed(0), 10, 20);
    }
}
