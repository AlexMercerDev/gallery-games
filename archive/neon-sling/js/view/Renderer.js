export class Renderer {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
    }

    render(state, alpha) {
        // Clear background
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Save context for camera transform
        this.ctx.save();

        // Simple camera follow (center player vertically)
        const targetCamY = -state.player.y + this.height * 0.6;
        // Smooth camera approach could go here, but for now direct:
        this.ctx.translate(0, targetCamY);

        // Draw Void
        this.drawVoid(state.voidLineY);

        // Draw Anchors
        state.anchors.forEach(anchor => {
            this.drawAnchor(anchor);
        });

        // Draw Player
        this.drawPlayer(state.player);

        // Draw Drag Line
        if (state.input && state.input.isDragging && state.player.isAnchored) {
            this.drawAimLine(state.player, state.input);
        }

        this.ctx.restore();

        // Draw UI / HUD
        this.drawHUD(state);

        // Draw Game Over
        if (state.player.isDead) {
            this.drawGameOver();
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = 'red';
        this.ctx.font = 'bold 60px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px monospace';
        this.ctx.fillText('Click to Restart', this.width / 2, this.height / 2 + 50);
        this.ctx.textAlign = 'left'; // Reset
    }

    drawAimLine(player, input) {
        const { dragStart, dragCurrent } = input;
        const dx = dragStart.x - dragCurrent.x;
        const dy = dragStart.y - dragCurrent.y;

        // Visual multiplier (make line longer than actual pull for visibility)
        const visMult = 1.0;

        this.ctx.beginPath();
        this.ctx.moveTo(player.x, player.y);
        this.ctx.lineTo(player.x + dx * visMult, player.y + dy * visMult);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = 'white';
        this.ctx.setLineDash([10, 10]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawPlayer(player) {
        const { x, y, radius, isAnchored } = player;

        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.fillStyle = '#00ffff';

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0; // Reset
    }

    drawAnchor(anchor) {
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff00ff';

        this.ctx.beginPath();
        this.ctx.arc(anchor.x, anchor.y, anchor.radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner detail
        this.ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    drawVoid(y) {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        this.ctx.fillRect(0, y, this.width, 1000); // Infinite void below

        this.ctx.strokeStyle = 'red';
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.width, y);
        this.ctx.stroke();
    }

    drawHUD(state) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px monospace';
        this.ctx.fillText(`SCORE: ${Math.floor(state.score)}`, 20, 40);
        this.ctx.fillText(`HIGH: ${Math.floor(state.highScore)}`, 20, 70);
    }
}
