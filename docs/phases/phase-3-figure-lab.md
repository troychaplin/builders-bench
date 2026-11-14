# Phase 3: The Character Figure Mix-and-Match Lab (`/figure-lab`)

## Goal
Build an interactive 3D/SVG Block Figure customizer where users mix and match heads, helmets/hair, torsos, legs, and accessories, save custom heroes, and spawn them directly onto the 3D workbench in `/studio`.

## Technical Requirements

### 1. Stylized Block Figure Design (Original Proportions)
- Give Builder's Bench characters a distinct, stylized geometric silhouette (slightly chunkier voxel/capsule proportions with articulated block boots and visor/helmet mounts) so they feel uniquely native to Builder's Bench while snapping cleanly onto a 2x2 stud footprint.

### 2. Modular Parts Catalog (`src/data/figureParts.ts`)
Create rich modular components across 5 slots:
- **Headgear / Hair:** Space Helmet, Knight Visor, Ninja Hood, Spiky Hair, Wizard Hat, Royal Crown, Cyber Visor.
- **Expressions (Heads):** Classic Smile, Hero Grin, Cool Sunglasses, Bot Face, Pirate Eyepatch, Battle Determination.
- **Torsos:** Astronaut Suit, Castle Armor, Hero Emblem, Ninja Tunic, Street Hoodie, Cyber Mech Chest.
- **Legs:** Standard Trousers, Armored Greaves, Utility Belt Legs, Mech Legs.
- **Accessories:** Laser Blaster, Energy Blade, Broadsword, Wrench, Tower Shield, Crystal Staff.
- Allow independent color customization for headgear, torso, arms, legs, and accessory using `brickCatalog.ts` colors.

### 3. Interactive Customizer UI
- **Slot Selector + "Randomize Hero" Slot-Machine Button:** Spin all 5 parts and colors randomly with a fun reel animation.
- **Character Card Generator:** Let the user name their character, pick a faction (*Space*, *Castle*, *City*, *Heroes*), and generate a collectible Builder ID Card.
- **Permanent Save:** Save custom figures to `localStorage` AND export/import `.figure.json` files.

### 4. Bridge to `/studio` (3D Baseplate Integration)
- Add a 3D procedural Figure mesh (`BlockFigureMesh.tsx`) built from Three.js primitives matching the chosen parts and colors.
- In `/studio`, add a **"My Figures"** drawer tab allowing the user to click any saved character and place them onto the 3D baseplate alongside their brick builds!