# Game Design Document: Puff Jump

## 1. Game Overview
**Title:** Puff Jump
**Genre:** One-Button Endless Runner
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual players who enjoy rhythm and speed (e.g., *Canabalt*, *Jetpack Joyride*).
**Core Pillar:** "Speed and Flow". The game should feel fast and fluid.

## 2. Gameplay Mechanics
*   **Goal:** Run as far as possible without falling into a gap or hitting a wall.
*   **Controls:**
    *   **Any Input (Tap/Click/Space):** Jump.
    *   **Hold:** Jump Higher (Variable jump height for precision).
*   **Core Loop:**
    *   **Auto-Run:** The Puff runs automatically to the right. Speed increases over time.
    *   **Obstacles:**
        *   **Gaps:** Jump over them.
        *   **Crates/Antennas:** Trip the player (slow down) or block path (game over if hitting a tall wall).
        *   **Windows:** Smash through glass (Juice!).
    *   **Failure:** Falling down a gap or getting crushed by the scrolling screen (if slowed down too much).

## 3. Game Entities
*   **Player (Runner Puff):** Wears a headband/scarf that trails in the wind (visual speed indicator).
*   **Building Tops:** The platforms. Varying heights and widths.
*   **Background:** Parallax scrolling city layers (Near, Mid, Far).
*   **Debris:** Pigeons, glass shards, smoke.

## 4. Visual Style

Font: Arial Black, Italic, Skewed -10° (Speed feel).
Theme: White & Green (Fresh/Nature).
HUD: Large, slanted score display. Pulsing Blue/White hint text.
Sky: Dynamic blue gradient that looks fresh and bright.
Clouds: Fluffy white clouds drifting in parallax.
Ground: Grassy platforms with dirt underneath. Moving platforms are lighter green.
Character: A cute white Puff (with rainbow tint gone, back to classic look) rolling through the hills.
Hazards: Spikes are now sharp red thorns/spikes that contrast well with the grass.

*   **Camera:** Dynamic. Zooms out as speed increases. Shakes on impact.

## 6. User Interface & Typography
*   **Font Family:** `Arial Black` (or heavy sans-serif system font).
*   **Style:** Italicized and Skewed (-10deg) to convey speed and momentum.
*   **Color Palette - Sunshine Theme:**
    *   **Text/UI:** White (#FFF) with Green Shadows (#4CAF50).
    *   **Buttons:** Bright Green (#4CAF50) with Dark Green depth (#2E7D32).
    *   **Sky:** Linear Gradient from Sky Blue (#4FC3F7) to White/Light Blue (#E1F5FE).
    *   **Ground:** Nature Green (#4CAF50) and Dirt Brown (#795548).
*   **HUD Elements:**
    *   **Score:** Top-right, large, slanted. Resembles a racing tachometer.
    *   **Hint:** Bottom-center, pulsing. "TAP TO JUMP".
    *   **Game Over:** Central modal, rounded corners, drop shadow. "CRASHED" or "FELL".

## 7. Technical Architecture
*   **Engine:** Canvas API (2D).
*   **Level Generation:** procedural segments (Roof -> Gap -> Roof of different height).
*   **Physics:** Simple AABB collision. Gravity and horizontal velocity.
