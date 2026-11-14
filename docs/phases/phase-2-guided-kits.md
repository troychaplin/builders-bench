# Phase 2: Guided Micro-Kits & Custom Blueprint Creator (`/kits`)

## Goal
Create a step-by-step interactive instruction manual mode (`/kits`) where users can assemble pre-built micro-kits piece-by-piece on Builder's Bench—and convert any creation from `/studio` into a playable step-by-step kit.

## Technical Requirements

### 1. Built-In Micro-Kit Library (`src/data/starterKits.ts`)
Create 4–5 original pre-built `BuildProject` blueprints (15–35 bricks each) sorted by difficulty (using original, non-trademarked names):
1. **Turbo Red Racer** (Beginner — 14 pieces)
2. **Galaxy Starfighter** (Intermediate — 24 pieces)
3. **Pixel Block Monster** (Intermediate — 28 pieces)
4. **Medieval Watchtower** (Master Builder — 36 pieces)

### 2. Step-by-Step 3D Assembly Engine
- Sort the kit's `bricks` array from bottom layer (`y = 0`) upward so every step builds naturally on top of prior bricks.
- Group bricks into logical steps (1 to 3 bricks per step).
- **Visual Guidance:**
  - Completed steps render as solid placed bricks.
  - The **current step's bricks** render as glowing, pulsing holographic wireframe/ghost outlines on the baseplate.
  - Future steps remain hidden.
- **Interactive Snap:** Clicking on a ghost outline (or clicking a big "Snap Step Pieces" button) animates the bricks dropping onto the studs with the Web Audio snap sound and advances the step counter (`Step 4 / 12`).
- **Celebration Finale:** Completing the final step triggers a celebratory camera spin, confetti burst, and awards a "Master Builder Badge" saved to `localStorage`.

### 3. "Turn My Build Into a Kit" Integration
- Add a **"Play as Guided Kit"** button inside `/studio` (and via `.brick.json` upload on `/kits`) that automatically sorts any custom user creation bottom-to-top by `y` height and launches it in the step-by-step instruction viewer.