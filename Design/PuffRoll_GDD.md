# Game Design Document: Puff Roll

## 1. Game Overview
**Title:** Puff Roll
**Genre:** 3D Roller / Platformer
**Platform:** Web (Desktop & Mobile) - **Three.js**
**Target Audience:** Casual gamers, fans of "Marble Madness" or "Super Monkey Ball".

## 2. Gameplay Mechanics
*   **Goal:** Roll the Puff sphere from the Start Pad to the Finish Ring without falling off the edge.
*   **Controls:**
    *   **Desktop:** WASD / Arrow Keys to apply torque.
    *   **Mobile:** Virtual joystick or Device Orientation (Tilt).
*   **Physics:**
    *   Momentum-based movement.
    *   Gravity pulls you down (don't fall!).
    *   Bounciness: Moderate (Puff is a bit soft).

## 3. Core Loop
1.  **Spawn:** Drop onto the neon track.
2.  **Navigate:** Roll past shrinking platforms, moving blockers, and gaps.
3.  **Collect:** Grab floating "Data Cubes" or "Stars" for score.
4.  **Finish:** Reach the goal zone to warp to the next procedural level.

## 4. Visual Style (Three.js)
*   **Theme:** Cyber-void / Synthwave.
*   **Palette:** Cyan, Magenta, Deep Purple, Grid lines.
*   **Lighting:**
    *   Glowing finish zones.
    *   Rim lighting on the Puff sphere.
    *   Dynamic shadows from obstacles.
*   **Camera:** Third-person following (slightly elevated).

## 5. Technical Requirements
*   **Library:** Three.js (r128+).
*   **Physics:** Cannon.js or minimal custom sphere physics (for simplicity, custom physics is usually smoother for arcade feel).
*   **Performance:** Low poly models, simple shaders for platform compatibility.
