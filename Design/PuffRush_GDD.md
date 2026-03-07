# Game Design Document: Puff Rush

## 1. Game Overview
**Title:** Puff Rush
**Genre:** Side-Scrolling Endless Runner
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, fans of "Canabalt" or "Subway Surfers" but cuter.

## 2. Core Gameplay
**Objective:** Run as far as possible without hitting an obstacle or falling into a pit.

### Mechanics
*   **Auto-Run:** The character automatically runs to the right (World moves left).
*   **Jump:** Quick tap to Jump.
*   **Glide:** Jump and Hold to open a tiny umbrella and glide slowly (extends air time).
*   **Speed:** Game speed slowly increases over time.
*   **Obstacles:**
    *   **Rocks/Stumps:** Trip the player (Game Over).
    *   **Pits:** Gaps in the ground.
    *   **Birds:** Flying enemies to duck/jump under (Maybe too complex? Let's stick to ground obstacles first).

### Controls
*   **Mouse/Touch:** Tap to Jump. Hold to Glide.

## 3. Visual & Aesthetic
*   **Style:** Parallax scrolling layers to create depth.
*   **Setting:** Rolling Green Hills, distant mountains, fluffy clouds.
*   **Character:** "Puff" (Pink/Blue) rolling or bouncing along. When Gliding, holds a cute yellow umbrella.
*   **Feedback:** Dust trails when running, "Whoosh" lines when gliding.

## 4. Technical Architecture
*   **Engine:** `RushEngine.js`
*   **Rendering:** Canvas API.
*   **World Gen:** Segment-based generation (Pre-made chunks of "Ground", "Gap", "Obstacle" stitched together randomly).
*   **Collision:** AABB (Axis-Aligned Bounding Box).

## 5. Progression
*   **Score:** Distance traveled (meters).
*   **Leaderboard:** Local Top 5.
*   **Collectibles:** Coins/Cherries scattered in arc patterns to guide jumps.
