# Game Design Document: Puff Snake

## 1. Game Overview
**Title:** Puff Snake
**Genre:** Snake / Arcade
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Casual gamers, retro fans.

## 2. Core Gameplay
**Objective:** Collect as many **Baby Puffs** as possible without hitting walls or your own tail.

### Mechanics
*   **The Head:** You control the leader Puff.
*   **The Tail:** Each collected Baby Puff joins the line (Conga line style).
*   **Movement:** 
    *   **Not Grid-Locked:** Smooth 360-degree movement (or 8-way) for a modern feel.
    *   **Constant Speed:** The snake moves forward automatically.
*   **Growth:** Eating a snack/baby puff grows the tail lengh.
*   **Fail State:** Crashing into the screen bounds or your own tail.

### Controls
*   **Desktop:** Arrow Keys or Mouse to steer (Follow mouse pointer?).
*   **Mobile:** Touch and drag to steer (Joystick style) or tap sides to turn.
*   **Decision:** "Follow Mouse/Touch" provides the most fluid control for a smooth snake.

## 3. Visual & Aesthetic
*   **Style:** Minimalist clean look, similar to "Slither.io" but single player and cuter.
*   **Entities:**
    *   **Leader:** Wearing a conductor hat?
    *   **Followers:** Smaller Puffs bouncing along.
    *   **Tail Physics:** The tail shouldn't just be rigid; it should have a slight "spring" follow delay for cuteness.
*   **Background:** subtle grid or grass pattern.

## 4. Technical Architecture
*   **Engine:** `SnakeEngine.js`
*   **Tail Logic:** Array of positions. Since movement is smooth, we record history of Head Positions and space tail segments at fixed distances along that history path.
*   **Collision:** Circle-Circle collision for head vs food. Head vs Tail logic needs a "grace period" for the first few segments.

## 5. Progression
*   **Score:** Number of Puffs collected.
*   **Speed:** Increases slightly as you grow?
