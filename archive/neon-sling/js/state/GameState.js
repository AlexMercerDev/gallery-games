export class GameState {
    constructor() {
        this.score = 0;
        this.highScore = 0;

        this.player = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 10,
            isAnchored: true,
            anchorId: null,
            isDead: false,
            screenWidth: 1920 // Default, updated on resize
        };

        this.anchors = [];
        this.effects = [];

        this.camera = {
            y: 0
        };

        this.voidLineY = 2000; // Start far below
    }

    reset() {
        this.score = 0;
        this.player.isDead = false;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isAnchored = true;
        // Reset positions based on screen size in GameEngine
    }
}
