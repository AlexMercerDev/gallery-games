# Game Design Document: Cloud Hop

## 1. Game Overview
**Title:** Cloud Hop
**Genre:** Vertical Platformer / Endless Jumper
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, fans of "Doodle Jump".

## 2. Core Gameplay
**Objective:** Ascend as high as possible by jumping from cloud to cloud without falling.

### Mechanics
*   **Auto-Jump:** The character automatically bounces when touching a platform.
*   **Movement:** Player controls horizontal movement (Left/Right) via Mouse X or Touch.
*   **Wall Bounce:** Player bounces off the side walls (No screen wrap).
*   **Seeded Generation:** Levels are generated deterministically using a fixed seed, ensuring fair competition.
*   **Platforms:**
    *   **Normal Cloud:** Static.
    *   **Moving Cloud:** Moves horizontally (Appears > 500 Score).
    *   **Fragile Cloud:** Breaks after one jump (Appears > 1000 Score).
*   **Collectibles:**
    *   **Gold Stars:** Grant +50 Points. Spawn randomly on platforms.

### Controls
*   **Desktop:** Move Mouse to steer.
*   **Mobile:** Tap/Drag to steer.

## 3. Visual & Aesthetic
*   **Style:** Very cute, pastel, soft.
*   **Character:** A round "Puff" with a happy face (Reusing/Expanding Puff Merge assets).
*   **Environment:**
    *   **Background:** Gradient Blue/Pink sky that changes color as you get higher.
    *   **Clouds:** Fluffy white shapes with soft shadows.

## 4. Technical Architecture
*   **Engine:** Custom `HopEngine.js` (Lightweight canvas renderer).
*   **Physics:** Simple AABB vs Circle collision detection. Gravity and Velocity.
*   **Viewport:** Fixed 600px width container centered on screen for consistent difficulty.
*   **State:** Local Leaderboard (Top 5 Scores + Names) saved to `localStorage`.
*   **UI:** HTMl Overlay for Game Over and Name Entry.

## 5. Development Roadmap
1.  **Core Loop:** Player physics (Bounce/Gravity) + Platforms.
2.  **Level Gen:** Infinite procedural generation of platforms.
3.  **Visuals:** Draw cute assets.
4.  **Polish:** Game Over screen, Score display.
