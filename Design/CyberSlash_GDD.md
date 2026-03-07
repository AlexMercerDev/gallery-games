# Cyber Slash - Game Design Document

## 1. Core Concept
**"Superhot meets Fruit Ninja"**
A high-speed survival game where you control a cybernetic ninja cursor. 

## 2. Mechanics
### The Slash
- **Hold/Touch:** Time slows down significantly (0.1x). A "Slash Line" appears from the player character, following the input.
- **Release:** Time resumes. Player dashes instantly along the Slash Line.
- **Attack:** Any enemy intersected by the Slash Line during the dash is destroyed.

### Enemies
- **Drone:** Stationary, wanders slowly. Basic fodder.
- **Turret:** Fires slow-moving projectiles. You must slash the turret, not the bullet (or maybe you can deflect bullets?).
- **Chaser:** Moves towards player. Fast.

### Game Loop
- Survive as long as possible.
- Destroying enemies adds time (or energy).
- Getting hit by an enemy or projectile = Instant Death.

## 3. "The Juice" (Visuals & Feel)
- **Impact Frames:** Freeze the frame for 50-100ms upon a hit to sell the impact.
- **Screen Shake:** Violent shake on kill.
- **Chromatic Aberration:** Glitch effect on kill/death.
- **Particles:** Enemies shatter into geometric shards that persist for a few seconds.

## 4. Controls
- **Mobile:** Thumb drag to aim, release to go.
- **Desktop:** Mouse drag to aim, release to go.
