# Game Design Document: Puff Swing

## 1. Game Overview
**Title:** Puff Swing
**Genre:** Arcade / Physics / Climber
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, fans of "Spider-Man" style web-swinging mechanics.

## 2. Core Gameplay
**Objective:** Climb as high as possible by swinging from anchor points.

### Mechanics
*   **Anchors:** Floating bubbles/points distributed vertically.
*   **Grapple:** Tap/Hold to shoot a rope to the nearest anchor within range.
*   **Physics:**
    *   While holding, pulling force/centripetal force swings the Puff.
    *   Conservation of momentum on release.
*   **Release:** Let go of the input to release the rope and fly.
*   **Danger:**
    *   **Rising Lava/Water:** A hazard zone moves upwards. Falling into it is Game Over.
    *   **Gravity:** Constant downward force.
*   **Wall Bounce:** Puff can bounce off side walls (maybe with a satisfying thud/friction).

### Controls
*   **Mouse/Touch:**
    *   **Press & Hold:** Attach grapple to nearest valid anchor and Swing.
    *   **Release:** Detach and Fly.

## 3. Visual & Aesthetic
*   **Theme:** Jungle / Vine Canopy or Urban / Neon. Let's go with **Sky Canopy**.
*   **Puff:** Wearing an Indiana Jones hat or just a cute adventurer gear.
*   **Rope:** A stretchy vine or neon energy cord.
*   **Background:** Clouds, Birds, gradually turning to Space.
*   **Juice:**
    *   Rope tension effect (straightening).
    *   Wind lines when moving fast.
    *   Screen shake on high-velocity wall bumps.

## 4. Technical Architecture
*   **Engine:** `SwingEngine.js`
*   **Physics:**
    *   Verlet integration or simple Euler with constraint?
    *   Simple Pendulum constraint: `Constraint(Distance)`.
    *   Raycast/Distance check to find nearest anchor.
*   **Camera:** Follows Puff Y position (clamping bottom to lava level).

## 5. Progression
*   **Score:** Max Height (Meters).
*   **Unlockable:** New rope styles / trail colors? (Implicit via score).
