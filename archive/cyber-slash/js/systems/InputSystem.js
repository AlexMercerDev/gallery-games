export class InputSystem {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;

        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        // Touch
        this.canvas.addEventListener('touchstart', (e) => this.onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onEnd(e));

        // Mouse
        this.canvas.addEventListener('mousedown', (e) => this.onStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => this.onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', (e) => this.onEnd(e));
    }

    onStart(x, y) {
        this.isDragging = true;
        this.dragStart = { x, y };

        // SLOW DOWN TIME
        this.engine.targetTimeScale = 0.05; // 5% speed
    }

    onMove(x, y) {
        if (this.isDragging) {
            // Update Slash Line in state
            // Logic: Vector from DragStart to Current = Aim Vector
            // Inverted? Drag BACK to aim FORWARD (Slingshot) or Drag TOWARDS destination?
            // "Superhot" style normally you just look.
            // "Fruit Ninja" you swipe.
            // "Angry Birds" you drag back.
            // Let's go with "Drag to Aim" (Move cursor to where you want to go).
            // Actually mobile thumb obscures vision. 
            // Better: "Virtual Joystick" or "Drag Back".
            // Let's try: Drag Back (Slingshot) for precision.

            const dx = this.dragStart.x - x;
            const dy = this.dragStart.y - y;

            this.engine.state.slashLine = {
                start: { x: this.engine.state.player.x, y: this.engine.state.player.y },
                vector: { x: dx, y: dy }
            };
        }
    }

    onEnd(e) {
        if (this.isDragging) {
            this.isDragging = false;

            // RESUME TIME
            this.engine.targetTimeScale = 1.0;

            // EXECUTE DASH
            if (this.engine.state.slashLine) {
                const vec = this.engine.state.slashLine.vector;
                const power = 0.15; // Impulse multiplier

                this.engine.state.player.vx = vec.x * power;
                this.engine.state.player.vy = vec.y * power;
                this.engine.state.player.isDashing = true;

                // Clear line
                this.engine.state.slashLine = null;
            }
        }
    }
}
