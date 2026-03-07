# Neon Sling - Game Design Document

## 1. Overview
**Title:** Neon Sling  
**Genre:** Physics-based Endless Climber  
**Platform:** Web (Mobile & Desktop)  
**Target Audience:** Casual players, high-score chasers.

## 2. Core Gameplay
### Objective
Ascend as high as possible by slinging a glowing orb from one anchor point to another. Avoid obstacles and the rising "Digital Void".

### Mechanics
- **Anchor Points:** Rotating nodes that the player can latch onto. Some are stationary, some move.
- **Slinging:** Player drags on the screen to aim and power up a launch. Releasing flings the orb.
    - *Mobile:* Touch & Drag.
    - *Desktop:* Click & Drag.
- **Gravity:** The orb is affected by gravity. It arcs through the air.
- **The Void:** A rising line of static/glitch that instantly destroys the orb if touched. It forces the player to keep moving.
- **Obstacles:** Static geometric shapes (triangles, squares) and moving barriers.

### Controls
- **Aim:** Drag input (inverse kinematics - drag back to aim forward).
- **Fire:** Release input.

## 3. Visual Style
- **Theme:** Cyberpunk / Synthwave.
- **Palette:** Deep black background (`#050505`). Neon Cyan (`#00FFFF`), Magenta (`#FF00FF`), and Electric Lime (`#CCFF00`).
- **Effects:**
    - **Bloom:** Everything glows.
    - **Trails:** The orb leaves a fading light trail.
    - **Impact:** Particle explosion upon latching or dying.
    - **Glitch:** The "Void" and UI elements occasionally glitch.

## 4. Audio (Planned)
- **Music:** Driving synthwave bassline.
- **SFX:** "Pew" for launch, "Thud" for latch, "Crash" for death.

## 5. Progression & Scoring
- **Score:** Based on height achieved.
- **Multipliers:** Rapid consecutive jumps increase the multiplier (Combo system).
- **Highscore:** Persisted locally. Displayed prominently on the Game Over screen.

## 6. Technical Architecture (Multiplayer Readiness)
- **State Separation:** Game logic (physics, scoring) is decoupled from the renderer.
- **Deterministic Physics:** Fixed time step to ensure replays (ghosts) can be implemented later.
- **Input Queue:** Inputs are timestamped for potential server reconciliation.

## 7. Gallery Integration
- This game serves as the "Daily Feature".
- Future gallery games can share the same `HighscoreManager` and `InputManager` modules.
