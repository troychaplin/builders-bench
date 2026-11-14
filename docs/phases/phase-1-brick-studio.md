# Phase 1: The 3D Builder's Bench & Custom BuildBins (`/studio`)

## Goal
Build an interactive 3D virtual brick-building workbench using React Three Fiber (`@react-three/fiber` + `@react-three/drei`) with a stud-snapping grid, customizable BuildBin drawers, synthesized sound effects, and permanent `.brick.json` Cartridge + URL Hash saving.

## Technical Requirements

### 1. Client-Only 3D Canvas Setup
- Wrap the Three.js `<Canvas>` in a `'use client'` component loaded via `next/dynamic(..., { ssr: false })` to prevent Next.js SSR hydration errors.
- Render a **24x24 Stud Baseplate** (default Forest Green `#237841`, switchable to Desert Tan, Stone Gray, or Deep Space Black) with smooth, unbranded procedural cylinder studs on top of every grid coordinate.
- Use `<OrbitControls>` (right-click/two-finger drag to orbit, scroll to zoom, middle-drag to pan) so camera movement never conflicts with left-click brick placement.
- Add crisp workshop lighting (`ambientLight`, `directionalLight` with soft shadows, and `<Environment preset="city" />` or studio hemisphere light) so plastic bricks have realistic specular highlights.

### 2. Procedural 3D Brick Geometry (`BrickMesh.tsx`)
- Build a procedural 3D brick renderer that dynamically constructs any `BrickPart` from `brickCatalog.ts`:
  - Main rectangular body sized accurately to `(widthStuds, heightUnits, depthStuds)` respecting `rotation` (`0, 90, 180, 270`).
  - Smooth raised cylindrical studs on the top face (no brand embossing; omitted when `category === 'tile'` or `'slope'`).
  - Angled wedge geometry for `'slope'` parts and hollow frame styling for `'window'`.
  - Support `transparent` materials (`opacity: 0.72, transparent: true`) and `metallic` materials (`metalness: 0.7, roughness: 0.25`).

### 3. Stud-Snapping Placement & Editing
- **Raycasting & Ghost Preview:** Moving the cursor over the baseplate or existing bricks calculates the exact integer `(x, y, z)` stud coordinates and renders a translucent ghost preview of the active brick.
- **Controls:**
  - **Left Click:** Snap brick into place and play a synthesized plastic *click/snap* sound via the Web Audio API (no external `.mp3` files needed).
  - **`R` Key (or Rotate Button):** Rotate active brick 90 degrees clockwise.
  - **Delete / Eraser Mode (`X` Key):** Hovering over placed bricks highlights them in red; clicking removes the brick.
  - **Undo / Redo (`Cmd+Z` / `Cmd+Shift+Z`):** Maintain a history stack of `PlacedBrick[]` states.

### 4. Custom BuildBins & Parts Drawer
- **Bottom Quick-Access BuildBins:** Display 6 customizable "BuildBin" compartments along the bottom HUD (plus a Color Swatch bar).
- **Parts Drawer Modal:** Clicking "+ Fill BuildBins" opens a visual catalog where the user can filter parts by category and assign favorite parts/colors into their 6 active bins, or load preset themed bin kits (*Starter Mix*, *Space Cruiser Parts*, *Castle Masonry*).

### 5. Indestructible Save / Load System (No Cache Loss)
- **Auto-Save:** Mirror the active build to `localStorage`.
- **Download Build Cartridge (`.brick.json`):** Export the `BuildProject` JSON as a clean downloadable file (`my-creation.brick.json`).
- **Load Cartridge:** File picker + drag-and-drop onto the canvas to load any `.brick.json` file.
- **Shareable Blueprint URL:** Compress `BuildProject` with `lz-string` into the URL hash (`#build=...`) so copying the URL preserves the entire 3D build permanently.