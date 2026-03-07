export class EnemySpawner {
    constructor(state, canvas) {
        this.state = state;
        this.canvas = canvas;
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // ms
    }

    update(dt) {
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        // Decrease interval over time?
        if (this.spawnInterval > 500) this.spawnInterval -= 0.1 * dt;

        // Update Enemies
        this.state.enemies.forEach(enemy => {
            // Move towards player (Chaser logic stub)
            const dx = this.state.player.x - enemy.x;
            const dy = this.state.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            }
        });
    }

    spawnEnemy() {
        // Spawn at edge
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -20 : this.canvas.width + 20;
            y = Math.random() * this.canvas.height;
        } else {
            x = Math.random() * this.canvas.width;
            y = Math.random() < 0.5 ? -20 : this.canvas.height + 20;
        }

        this.state.enemies.push({
            x, y,
            speed: 0.1 + Math.random() * 0.1,
            type: 'chaser',
            radius: 10
        });
    }
}
