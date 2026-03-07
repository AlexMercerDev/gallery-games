# Game Design Document: Puff Pop

> [!CAUTION]
> **STATUS: ARCHIVED**
> **Reason:** Deemed too generic and derivative of "Puzzle Bobble". Lacked unique mechanics to stand out in the gallery.

## 1. Game Overview
**Title:** Puff Pop
**Genre:** Bubble Shooter (Puzzle Bobble style)
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, fans of satisfying "pop" mechanics.

## 2. Core Gameplay
**Objective:** Clear the ceiling of Puffs by shooting matching colored Puffs from a cannon at the bottom.

### Mechanics
*   **Aim & Shoot:** Player controls a launcher at the bottom center. Aim with mouse/touch, click to fire.
*   **Match-3:** Connect 3 or more Puffs of the same color to pop them.
*   **Disconnect:** Any Puffs no longer attached to the ceiling fall and pop (Bonus points!).
*   **Ceiling Drop:** Every few shots, the ceiling lowers. If Puffs reach the bottom line -> Game Over.
*   **Bank Shot:** Puffs bounce off the side walls.

### Controls
*   **Mouse:** Move to aim, Click to shoot.
*   **Touch:** Tap/Drag to aim, Release to shoot.

## 3. Visual & Aesthetic
*   **Style:** Bright, colorful, "Juicy".
*   **Entities:**
    *   **Puffs:** Round, colored balls with cute faces (Standard Puff assets).
    *   **Cannon:** A cute mechanism (maybe a flower or a pipe).
*   **Feedback:**
    *   **Pop:** Particle explosion + "Squeak" sound (visual only for now).
    *   **Fall:** Cute bounce animation when disconnected puffs hit the floor.

## 4. Technical Architecture
*   **Engine:** `PopEngine.js`
*   **Grid System:** Hexagonal grid for tight packing.
*   **Collision:** Raycast for trajectory (guide line), Circle-Circle for impact.
*   **State:** 2D Array or List of active bubbles.

## 5. Progression
*   **Score:** Points for popping + Bonus for drop.
*   **Leaderboard:** Local Top 5.
*   **Difficulty:** Ceiling drops faster over time, or introduces more colors.
