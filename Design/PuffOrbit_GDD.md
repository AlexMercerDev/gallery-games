# Game Design Document: Puff Orbit

## 1. Game Overview
**Title:** Puff Orbit
**Genre:** Arcade / Timing / Physics
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, fans of "One Button" games.

## 2. Core Gameplay
**Objective:** Jump from one planet to the next without drifting into deep space.

### Mechanics
*   **Orbiting:** The player (Puff) automatically orbits the current planet at a fixed speed.
*   **Launch:** Tap/Click to launch the Puff tangentially into space.
*   **Gravity:** Nearby planets exert gravity. If you aim correctly, the next planet's gravity captures you, and you enter its orbit.
*   **The Void:** If you miss and fly off-screen or run out of momentum, it's Game Over.
*   **Obstacles:** Some planets orbit in opposite directions, vary in size, or have asteroids blocking the path.
*   **Dynamic Difficulty:** Planets get smaller, farther apart, or move (orbiting the sun?) as you progress.

### Controls
*   **One Button:** Tap/Space to Launch.

## 3. Visual & Aesthetic
*   **Theme:** Deep Space / Galaxy.
*   **Puff:** Wearing a tiny Astronaut Helmet (Bubble).
*   **Planets:** Colorful, varying sizes, maybe some with rings.
*   **Background:** Starfield that scrolls parallax as you move up/forward.
*   **Juice:** Trail effects, screen warp on launch, "Magnetic" snap effect when caught by gravity.

## 4. Technical Architecture
*   **Engine:** `OrbitEngine.js`
*   **Physics:**
    *   Circular motion state (Angle, Radius, Speed).
    *   Linear motion state (Velocity Vector).
    *   Distance check for "Capture" radius of next planet.
*   **Level Generation:** Infinite procedural generation of planets ahead of the player.

## 5. Progression
*   **Score:** Number of planets visited.
*   **Combos:** Fast jumps (landing and jumping immediately) or "Perfect Center" orbit entries?
