# Game Design Document: Puff Drill

## 1. Game Overview
**Title:** Puff Drill
**Genre:** Endless Digger / Arcade
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Fans of *Mr. Driller*, *Dig Dug*, or satisfying ASMR games.

## 2. Gameplay Mechanics
*   **Goal:** Drill as deep as possible before running out of energy or hitting too many hazards.
*   **Controls:**
    *   **Desktop:** Arrow Keys (Left, Right, Down).
    *   **Mobile:** Tap Left/Right/Bottom of screen (or virtual D-Pad).
*   **Core Loop:**
    *   **Dig:** Moving into a soft dirt block destroys it instantly (satisfying crunch).
    *   **Avoid:** Hard Rocks cannot be drilled (reduce Health/Energy if hit).
    *   **Collect:** Gems and "Battery Packs" to restore energy.
    *   **Gravity:** Loose blocks/rocks might fall if undermined (Mr. Driller mechanic) - *Optional for MVP, maybe too complex. Let's stick to static hazards first, then add falling physics if possible.* -> *Decision: Static hazards for MVP to ensure "Simple" pillar.*

## 3. Game Entitites
*   **Player (Drill Puff):** A Puff wearing a yellow hard hat and holding a jackhammer.
*   **Dirt/Soil:** Colorful layers. Easy to destroy.
*   **Rocks:** Grey/Black. Indestructible obstacles.
*   **Obsidian:** Bedrock (Screen boundaries).
*   **Gold/Diamonds:** Score bonuses.
*   **TNT:** If drilled, explodes a 3x3 area (Good for clearing rocks, but might hurt player if not careful? let's make it safe-clear for now).

## 4. Visual Style
*   **Theme:** Underground Geology.
*   **Palette:** Layers of Brown, Orange, Purple, Blue (as you go deeper).
*   **Juice:**
    *   **Screen Shake:** On every block break (subtle) and TNT (heavy).
    *   **Particles:** Debris flying everywhere.
    *   **Flash:** White flash on combo.

## 5. Technical Architecture
*   **Grid System:** The world is a 2D Array of tiles.
*   **Scrolling:** Camera follows player down. Old rows are unloaded.
*   **Input:** Grid-based movement (snaps to tiles).
