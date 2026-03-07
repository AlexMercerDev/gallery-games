export class SlashRenderer {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    render(state, dt) {
        // Clear with trails
        this.ctx.fillStyle = 'rgba(17, 0, 17, 0.3)'; // Low opacity for trail effect
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Slash Line (Predictive)
        if (state.slashLine) {
            this.drawSlashLine(state.slashLine, state.player);
        }

        // Draw Player
        this.drawPlayer(state.player);

        // Draw Enemies
        state.enemies.forEach(enemy => this.drawEnemy(enemy));

        // Draw Particles
        this.drawParticles(state.particles);

        // UI
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px monospace';
        this.ctx.fillText(`SCORE: ${state.score}`, 20, 40);
    }

    drawPlayer(player) {
        this.ctx.save();
        this.ctx.translate(player.x, player.y);

        // Rotate based on velocity?
        const angle = Math.atan2(player.vy, player.vx);
        this.ctx.rotate(angle);

        this.ctx.fillStyle = player.isDashing ? '#fff' : '#00ffcc';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00ffcc';

        // Triangle shape
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, 10);
        this.ctx.lineTo(-10, -10);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawEnemy(enemy) {
        this.ctx.fillStyle = '#ff0033';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff0033';
        this.ctx.beginPath();
        this.ctx.rect(enemy.x - 10, enemy.y - 10, 20, 20);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    drawSlashLine(line, player) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(player.x, player.y);
        this.ctx.lineTo(player.x + line.vector.x, player.y + line.vector.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Impact point?
    }

    drawParticles(particles) {
        this.ctx.fillStyle = '#ffffff';
        particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1.0;
    }
}
