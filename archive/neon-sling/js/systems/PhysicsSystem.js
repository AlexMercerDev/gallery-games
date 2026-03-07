export class PhysicsSystem {
    constructor(gameState) {
        this.state = gameState;
        this.gravity = 0.001; // Pixels per ms squared (approx)
        this.drag = 0.99; // Air resistance
    }

    update(dt) {
        const { player, obstacles, height } = this.state;

        if (player.isDead) return;

        if (!player.isAnchored) {
            // Apply Gravity
            player.vy += this.gravity * dt;

            // Apply Velocity
            player.x += player.vx * dt;
            player.y += player.vy * dt;

            // Apply Drag
            player.vx *= this.drag;
            player.vy *= this.drag;

            // Bounce off walls
            if (player.x < 0 || player.x > player.screenWidth) {
                player.vx *= -1;
                player.x = Math.max(0, Math.min(player.x, player.screenWidth));
            }
        }

        this.checkCollisions();
    }

    checkCollisions() {
        const { player, anchors } = this.state;

        // Simple circle-circle collision
        for (const anchor of anchors) {

            if (player.isAnchored) continue;

            const dx = player.x - anchor.x;
            const dy = player.y - anchor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check if we hit the anchor
            if (dist < player.radius + anchor.radius) {
                // Collision! Latch on.
                player.isAnchored = true;
                player.anchorId = anchor.id;
                player.vx = 0;
                player.vy = 0;

                // Snap to center
                player.x = anchor.x;
                player.y = anchor.y;

                // Calculate Score based on height.
                // Assuming Y decreases as we go up.
                // Base score on max height achieved inverted
                const currentHeight = -player.y;
                if (currentHeight > this.state.score) {
                    this.state.score = currentHeight;
                    if (this.state.score > this.state.highScore) {
                        this.state.highScore = this.state.score;
                        localStorage.setItem('neon-sling-highscore', this.state.highScore);
                    }
                }

                break;
            }
        }
    }
}
