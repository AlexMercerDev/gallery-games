export class InputManager {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.state = gameState;

        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragCurrent = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        // Mouse
        this.canvas.addEventListener('mousedown', (e) => this.onStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => this.onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', () => this.onEnd());

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onStart(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
            this.onMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        window.addEventListener('touchend', () => this.onEnd());
    }

    onStart(x, y) {
        if (this.state.player.isDead) {
            // Restart logic could go here or be handled by a UI manager
            this.state.requestRestart = true;
            return;
        }

        // Only allow drag if anchored
        if (this.state.player.isAnchored) {
            this.isDragging = true;
            this.dragStart = { x, y };
            this.dragCurrent = { x, y };
        }
    }

    onMove(x, y) {
        if (this.isDragging) {
            this.dragCurrent = { x, y };
            // Update visual aim line in state? Or just store input?
            // For now, let's store input in state for the Renderer to see
            this.state.input = {
                isDragging: true,
                dragStart: this.dragStart,
                dragCurrent: this.dragCurrent
            };
        }
    }

    onEnd() {
        if (this.isDragging) {
            this.isDragging = false;

            // Calculate vector
            const dx = this.dragStart.x - this.dragCurrent.x;
            const dy = this.dragStart.y - this.dragCurrent.y;

            // Apply impulse
            // Multiplier for power
            const power = 0.05;

            // Fire event / Update state
            this.state.player.vx = dx * power;
            this.state.player.vy = dy * power;
            this.state.player.isAnchored = false;
            this.state.player.anchorId = null;

            // Clear input state
            this.state.input = { isDragging: false };
        }
    }
}
