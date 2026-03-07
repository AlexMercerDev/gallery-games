# Game Design Document: Puff Stack

## 1. Game Overview
**Title:** Puff Stack
**Genre:** Rhythm / Stacker / Arcade
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, fans of "Stack" or "Tower Bloxx".

## 2. Core Gameplay
**Objective:** Build the highest tower possible by stacking blocks.

### Mechanics
*   **The Base:** Starts with a wide base block.
*   **The Slider:** A new block slides back and forth above the tower.
*   **The Input:** Tap/Click to drop the block.
*   **Cutting:** Any part of the block that overhangs the tower below is cut off and falls away (physics). The next block will be the size of the remaining width.
*   **Precision:**
    *   **Perfect Drop:** If you align it perfectly (within a small margin), the block flashes/glows, and you get a combo.
    *   **Combo Bonus:** Consecutive perfect drops can slightly widen the block back to maximum size.
*   **Fail State:** If the block misses the tower completely (width becomes 0), Game Over.

### Controls
*   **Anywhere:** Tap/Click/Spacebar to drop the block.

## 3. Visual & Aesthetic
*   **Style:** Clean, 2.5D isometric or simple 2D side view? **2D Side View** fits the gallery best (consistent with others).
*   **Theme:** "Puff Pastry" or Soft Pillows.
*   **Colors:** Blocks change color as you go up (Rainbow gradient).
*   **Background:** Dynamic gradient that changes from Blue Sky -> Sunset -> Starry Space as height increases.
*   **Juice:**
    *   Screen shake on heavy drops.
    *   Musical notes on Perfect drops (Major scale C, D, E, F...).

## 4. Technical Architecture
*   **Engine:** `StackEngine.js`
*   **Physics:**
    *   Simple AABB overlap calculation for the cutting logic.
    *   "Debris" physics for the cut-off pieces (simple gravity + rotation).
*   **Camera:** Moves up as the stack grows.

## 5. Progression
*   **Score:** Number of blocks stacked.
*   **Leaderboard:** Local Top 5.
*   **Speed:** Block sliding speed increases as score increases.
