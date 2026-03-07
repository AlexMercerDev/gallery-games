# Game Design Document: Puff Shield

## 1. Game Overview
**Title:** Puff Shield
**Genre:** Radial Defense / Arcade
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, fans of "Super Hexagon" (but easier) or "Pong" mechanics.

## 2. Core Gameplay
**Objective:** Protect the **Sleeping Puff** in the center from incoming **Nightmares** (Spikes/Rocks) for as long as possible.

### Mechanics
*   **The Center:** A cute Sleeping Puff sits in the middle of the screen.
*   **The Shield:** An arc (approx 90 degrees) orbits the center.
*   **Control:** Moving the Mouse (or dragging touch) rotates the Shield around the center.
*   **Enemies:** Projectiles spawn from the screen edges and travel towards the center.
*   **Defense:**
    *   If a projectile hits the **Shield**, it is blocked/destroyed (+1 Score).
    *   If a projectile hits the **Sleeping Puff**, it wakes up -> **Game Over**.
*   **Progression:** Spawns get faster and more frequent over time.

### Controls
*   **Mouse:** Move left/right to rotate the shield counter-clockwise/clockwise.
*   **Touch:** Drag left/right (or circular drag) to rotate.

## 3. Visual & Aesthetic
*   **Style:** Darker "Night Mode" theme (Deep Purple/Blue background) to contrast with the bright "Day" themes of other games.
*   **Entities:**
    *   **Puff:** Sleeping, wearing a nightcap. Zzz particles.
    *   **Shield:** A glowing neon arc or a fluffy pillow? Let's go with a **Glowing Moon Crescent** to fit the theme.
    *   **Enemies:** Spiky dark shapes or "Bad Dreams".
*   **Feedback:** Screen shake on impact. bright flash when blocking.

## 4. Technical Architecture
*   **Engine:** `ShieldEngine.js`
*   **Mathematics:** Polar coordinates for shield rotation and spawn logic.
*   **Collision:** Line-Circle or Radial Segment collision.

## 5. Progression
*   **Score:** Number of Nightmares blocked.
*   **Leaderboard:** Local Top 5.
*   **Difficulty:**
    *   Phase 1: Slow, single projectiles.
    *   Phase 2: Projectiles from multiple angles.
    *   Phase 3: Spiraling projectiles?
