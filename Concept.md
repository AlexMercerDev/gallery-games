# Gallery Games - Concept & Vision

## 1. Vision Statement
**Gallery Games** is a curated collection of bite-sized, high-quality web games. The platform features a **"Daily Game"** mechanic, offering players a fresh experience every 24 hours. The focus is on instant fun, cute aesthetics, and addictive high-score loops.

## 2. Core Pillars
### A. Daily Rotation
*   **One Game Per Day**: The homepage automatically features a specific game based on the current date.
*   **Discovery**: Encourages players to try games they might otherwise skip.
*   **Dynamic Loading**: The system scans the available game library automatically, requiring no manual curation of the index.
*   **Highscores**: Highscores are captured (with "enter your name" mechanics)

### B. "Cute & Casual" First
*   **Aesthetic**: Pastel colors, soft shapes, and "kawaii" assets (faces on objects, particle effects).
*   **Gameplay**: Simple inputs (mouse/touch), physics-based interactions, and satisfying feedback loops ("Juice").
*   **Target Audience**: Casual gamers enticed by collecting and relaxing yet engaging mechanics (e.g., *Suika Game*, *Fruit Ninja*).
*   **Character Face expression**: "cute puff face" elements, specifically expressions like >_<, o_o, x_x and ^ ^. Face expressions change depending on context.
*   **Environment**: Bright blue sky, green grass, fluffy white clouds

### C. Zero Friction
*   **Instant Play**: No login required. No heavy assets.
*   **Cross-Platform**: Optimized for both Desktop (Mouse) and Mobile (Touch).
*   **Persistence**: Highscores and Ratings are saved locally in the browser.

## 3. Architecture
The project is built as a **Static Web Application** to ensure speed and portability.
*   **Frontend**: Vanilla HTML5, CSS3, and JavaScript (ES6 Modules).
*   **Backend**: None (Currently served via Python `http.server` for local development).
*   **Data Storage**: `localStorage` for Highscores, Ratings, and Game State.
*   **Game Engines**: Custom lightweight engines (e.g., `PuffEngine.js`, `slashEngine.js`) tailored to each game's specific mechanics.

## 4. Game Roster

### Active Games
| Game Title | Genre | Status | Description |
| :--- | :--- | :--- | :--- |
| **Puff Merge** | Physics Puzzle | 🟢 **Featured** | A "Suika-style" merge game. Drop soft, cute puffs into a container and merge them to create bigger puffs. Limitless high-score chasing. |
| **Cloud Hop** | Vertical Platformer | 🟢 **Featured** | An endless jumper. Bounce from cloud to cloud, collect stars, and avoid falling. Features seeded levels for fair competition. |
| **Puff Rush** | Endless Runner | 🟢 **Featured** | A side-scrolling runner. Jump and Glide over obstacles. Parallax scrolling and segment-based level generation. |
| **Puff Putt** | Golf / Physics | 🟢 **Featured** | A procedural mini-golf game. Drag to shoot, avoid obstacles, and sink putts in infinite generated levels. |
| **Puff Shield** | Radial Defense | 🟢 **Featured** | Protect the center core from incoming projectiles by rotating a shield. A test of reflexes and rhythm. |
| **Puff Snake** | Classic / Physics | 🟢 **Featured** | A smooth-moving snake game where you collect food and grow your tail. Avoid hitting yourself or the walls! |
| **Puff Stack** | Minimalist Arcade | 🟢 **Featured** | Stack moving blocks as high as possible. Precision is key—imperfect drops are sliced away! |
| **Puff Orbit** | Gravity / Launch | 🟢 **Featured** | Launch a character from planet to planet using gravity. Avoid asteroids and collect coins. |
| **Puff Swing** | Physics / Climber | 🟢 **Featured** | Use a grappling hook to swing up away from rising lava. Momentum-based swinging fun. |

### Archived / Prototypes
| Game Title | Genre | Status | Reason for Archive |
| :--- | :--- | :--- | :--- |
| **Neon Sling** | Physics Platformer | 🔴 Archived | Mechanics felt too punishing; lacked "just one more try" appeal. |
| **Cyber Slash** | Action / Reflex | 🔴 Archived | "Time-stop" mechanic was interesting but deemed too abstract/hard for the target casual audience. |
| **Puff Pop** | Bubble Shooter | 🔴 Archived | Too generic/derivative. |
| **Puff Roll** | 3D Roller | 🔴 Archived | Too generic and not special enough. Physics felt standard. |
| **Puff Rescue** | Lunar Lander | 🔴 Archived | Too hard for mobile inputs. Not additive enough to the roster. |
| **Puff Drill** | Endless Digger | 🔴 Archived | Controls didn't translate well to mobile engagement. |

## 5. Future Roadmap
*   **Social Sharing**: Generate "Share your Score" images.
*   **More Games**: Expand the library with "Match-3" or "Endless Runner" concepts.
*   **Theming**: Dynamic background changes based on the Daily Game.