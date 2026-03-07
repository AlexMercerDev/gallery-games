# Puff Merge - Game Design Document

## 1. Overview
**Title:** Puff Merge  
**Genre:** Physics Merge Puzzle  
**Target Audience:** Girls (and everyone who likes cute things), 10-14yo.  
**Vibe:** Cozy, Pastel, Bouncy, Sweet.

## 2. Gameplay
### The Loop
1.  **Aim**: Move a fluffy cloud character left/right at the top of the screen.
2.  **Drop**: Release a random "Puff" (Tier 1-3).
3.  **Merge**: When two Puffs of the same tier touch, they merge into one Puff of the next tier.
    *   *Example:* 2x Pink Berries -> 1x Blue Mochi.
4.  **Score**: Bigger merges = More points.
5.  **Lose**: If the Puffs overflow the container line.

### The Puffs (Progression)
1.  **Berry** (Pink, Radius 20) - ^.^
2.  **Lime** (Green, Radius 30) - >.<
3.  **Plum** (Purple, Radius 45) - o.o
4.  **Orange** (Orange, Radius 60) - OwO
5.  **Melon** (Red, Radius 80) - U_U
6.  **Star** (Yellow, Radius 100) - ◕‿◕

## 3. Visuals & Audio
- **Palette:** Soft Pastels. Background is a picnic blanket or sky pattern.
- **Style:** Vector art, thick rounded strokes. Face emotes on every ball.
- **Effects:**
    - **Merge:** Burst of stars and hearts.
    - **Bounce:** Soft body deformation (squash and stretch).
    - **Audio:** "Pop!", "Squeak!", "Yay!" (Planned).

- **Physics:** Needs stable stacking.
- **Input:** Single touch/click.
- **UI:** HTML Overlay for Game Over and Highscore Entry.

## 5. Progression & Engagement
- **Leaderboard:** Local Top 5 Highscores stored in browser.
- **Persistence:** Scores are permanent (until cache clear).
- **Name Entry:** Players can enter a name upon achieving a high score.
