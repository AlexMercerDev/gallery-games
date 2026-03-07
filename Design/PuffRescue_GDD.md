# Game Design Document: Puff Rescue

## 1. Game Overview
**Title:** Puff Rescue
**Genre:** Lunar Lander / Thrust Arcade
**Platform:** Web (Desktop & Mobile)
**Target Audience:** Fans of high-stakes physics control games.

## 2. Gameplay Mechanics
*   **Goal:** Pilot the Puff Rescue Module from the spawn point to the target Landing Pad.
*   **Controls:**
    *   **Thrust (Up):** Apply upward force (Space / Tap).
    *   **Rotate (Left/Right):** Rotate the ship (A/D / Tilt or Touch Sides).
*   **Physics:**
    *   Gravity is constant.
    *   Inertia is distinct (Puff slides a bit).
    *   **Fuel:** Limited resource. Managing fuel is key.
*   **Hazards:**
    *   Walls/Ceilings (Crash = Restart).
    *   Moving Lasers.
    *   Wind Zones.

## 3. Core Loop
1.  **Launch:** Lift off from the base.
2.  **Navigate:** Carefully feather the thruster to avoid obstacles.
3.  **Land:** Touch down gently on the green pad. (Speed must be low, angle upright).
4.  **Score:** Based on remaining fuel and time.

## 4. Visual Style
*   **Theme:** Cavernous Alien Moon.
*   **Palette:** Dark purples/blues (background), Neon Green (safe), Red (danger).
*   **Puff:** Wearing a cute little helmet/lander legs.
*   **Effects:** Thruster particles, crash explosions.

## 5. Technical Architecture
*   **Engine:** Canvas API (2D).
*   **Collision:** Polygon vs Circle/Polygon (SAT or simple distance checks depending on complexity).
*   **Input:** Touch/Keyboard.
