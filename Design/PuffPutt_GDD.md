# Game Design Document: Puff Putt

## 1. Game Overview
**Title:** Puff Putt
**Genre:** Endless Physics Golf
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, fans of "Desert Golfing" or "Angry Birds".

## 2. Core Gameplay
**Objective:** Complete as many holes as possible before running out of "Shots".

### Mechanics
*   **Slingshot Aim:** Click/Touch and Drag back to aim and set power. Release to launch the Puff.
*   **Physics:** The Puff bounces off walls and obstacles. Gravity applies.
*   **Friction:** The Puff stops eventually due to ground friction.
*   **Hole:** Reaching the hole (flag) loads the next level.
*   **Resource System (The Twist):**
    *   Start with **10 Shots**.
    *   Each shot costs **1 Shot**.
    *   Sinking the ball awards bonus shots:
        *   **Hole-in-One:** +3 Shots.
        *   **Under Par:** +2 Shots.
        *   **Just made it:** +1 Shot.
    *   **Game Over:** When you run out of shots.

### Controls
*   **Mouse/Touch:** Drag & Release to shoot.

## 3. Visual & Aesthetic
*   **Style:** Clean, minimalist, "Zen" but cute.
*   **Setting:** Floating islands or grassy vectors.
*   **Character:** A round white golf-Puff with a determined face `>_<` while aiming, happy `^o^` when in hole.
*   **Feedback:** Trajectory line (dotted) while aiming. Confetti when sinking a putt.

## 4. Technical Architecture
*   **Engine:** `PuttEngine.js`
*   **Physics:** Circle-Line collision. Friction handling. Restitution (bounciness).
*   **Level Gen:** Procedural terrain.
    *   **Flat:** Simple putt.
    *   **Hill:** Shoot over a bump.
    *   **Pit:** Don't fall off! (Falling off = Reset to start, -1 Shot).
    *   **Obstacles:** Blocks, Windmills? (Start with static blocks).

## 5. Progression
*   **Score:** Number of Holes cleared.
*   **Leaderboard:** Local Top 5.
