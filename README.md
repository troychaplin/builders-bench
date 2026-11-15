# Builder's Bench

An interactive 3D brick-building workshop in the browser: a free-build studio, step-by-step guided kits, a block figure lab, and a searchable set encyclopedia. It's a fully static site: everything runs client-side with no server, backend or account. Builds, figures and wish lists save to your browser and export as portable JSON files or share links.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and React Three Fiber.

## Modules

| Route | Module | What it does |
| --- | --- | --- |
| `/` | **Workbench Hub** | Blueprint-style landing page with an interactive isometric preview and links to every module. |
| `/studio` | **BuildBin Studio** | Free-build in 3D on a baseplate from 16×16 to 64×64 studs. |
| `/kits` | **Guided Kits** | Assemble micro-kits step by step, or turn any studio build into a kit. |
| `/figure-lab` | **Figure Lab** | Mix and match block figure parts, generate a Builder ID card, and place heroes in the studio. |
| `/sets` | **Set Explorer** | Search, filter and compare brick sets, and keep a portable dream wish list. |

### BuildBin Studio

- Stud-snapping placement with a translucent preview that turns red where a piece can't go. The rules block overlapping, floating, and stacking on tiles, slopes or figures.
- 48 procedurally modeled parts in 27 colours, including transparent and metallic finishes: bricks, plates and tiles in many sizes, 45° and 33° slopes, inverted slopes, arches, corner pieces, round bricks, a cone, a window, and a wheel and axle.
- A floating **tool rail**: Project, Blocks, Colour, Paint, Eraser, Rotate, Baseplate, Figures, Undo, Redo and Clear. It sits on the left on desktop and along the bottom on phones.
- A **Project** panel for the build's name, share link, saving and opening files, Play as Guided Kit and sound.
- A top **status bar** with the piece count, the selected part, live X/Y/Z coordinates, the view controls and Share.
- A **Blocks** browser with search, categories and thumbnails. A **Recent** strip keeps the last six blocks you placed, and keys 1–6 pick from it.
- A **colour picker** with recent colours, then every colour grouped as solid, transparent or metallic.
- A **Figures** panel for placing saved Figure Lab heroes onto the baseplate.
- Baseplate sizes from 16×16 to 64×64 studs (24×24 by default). Resizing keeps the build centred and can be undone; sizes too small for the build are disabled.
- Eraser and paint tools, 90° clockwise rotation, 100-step undo/redo, twelve baseplate colours (including white), and synthesized Web Audio snap sounds.
- **Saving:** autosave to `localStorage`, `.brick.json` cartridge export and import (including drag-and-drop), and compact `#b=` share links (older `#build=` links still open).

### Guided Kits

- Four original kits: Turbo Red Racer, Galaxy Starfighter, Pixel Block Monster and Medieval Watchtower (14–36 pieces).
- Builds are sorted bottom-up and grouped into steps of up to three matching pieces. The current step glows as a pulsing hologram, and each step has a "parts needed" call-out.
- Click the hologram or press Space to snap the step's pieces into place.
- Finishing a kit triggers a camera spin and confetti and awards a **Master Builder Badge**.
- **Play as Guided Kit** in the studio, or a `.brick.json` upload on `/kits`, turns any creation into instructions.

### Figure Lab

- Five part slots with 50 original options: 13 headgear (including bare head), 10 expressions, 10 torsos, 6 legs and 11 accessories (including empty hands), each slot with its own colour (plus skin tone).
- **Randomize Hero** spins slot-machine reels that settle one slot at a time.
- Choose a name and faction (Space, Castle, City, Heroes), and generate a collectible **Builder ID card** that downloads as a PNG.
- Save heroes to My Figures, or export and import them as `.figure.json` files.

### Set Explorer

- A built-in catalog of 76 iconic sets, searched and filtered entirely in the browser.
- Search by name or set number (e.g. `75192`), filter by theme, release-year range and piece count, and sort. Filters are kept in the URL, so filtered views can be shared.
- Each set's detail view links to its official building instructions and its Rebrickable page.
- Compare up to three sets side by side.
- **Dream Set Wish List** with set and brick totals, plus `.json` export and import.

## Getting started

Requires Node.js 20.9 or later.

```bash
npm install
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

The app is a static export (`output: "export"` in `next.config.ts`). `npm run build` writes plain HTML, CSS and JavaScript to `out/`, which any static host can serve. It's published on [Spacefast](https://spacefast.com) from this GitHub repository: every push to `main` builds and deploys the site automatically, and pull requests get preview builds.

Because there's no server, the export can't include route handlers or Next's image optimizer. Set thumbnails load directly from Rebrickable's CDN. Tailwind runs through PostCSS (`postcss.config.mjs`), so styles build correctly with both Turbopack (local dev) and webpack.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Static production build into `out/`. |
| `npx serve out` | Preview the static build locally (`next start` doesn't apply to static exports). |
| `npm run lint` | Run ESLint. |
| `npx tsx scripts/validate-kits.ts` | Check that every starter kit can be assembled step by step under the studio's placement rules. |

## Controls

**Studio**

| Input | Action |
| --- | --- |
| Left-click | Place, erase or paint (depending on the tool) |
| Right-drag / two-finger drag | Orbit the camera |
| Middle-drag / arrow keys | Pan |
| Scroll / pinch | Zoom |
| `B` | Open the Blocks browser |
| `C` | Open the colour picker |
| `1`–`6` | Pick a recent block |
| `V` | Toggle 3D / top-down 2D view |
| `Q` / `E` | Rotate the baseplate view left / right |
| `W` / `S` | Tilt the 3D view up / down |
| `R` / `⇧R` | Rotate the piece clockwise / counter-clockwise |
| `⇧` + scroll | Rotate the piece in place |
| `X` | Toggle eraser |
| `P` | Toggle paint |
| `F` | Open the Figures panel |
| `Esc` | Close the open panel, or go back to building |
| `⌘Z` / `⇧⌘Z` | Undo / redo |
| `?` | Show the controls panel |

**Guided Kits:** `Space`, `Enter` or `→` snaps the current step; `←` steps back.

## Project structure

```
src/
├── app/                  Routes: /, /studio, /kits, /kits/[slug], /kits/play, /figure-lab, /sets
├── components/
│   ├── studio/           3D scene, brick meshes, status bar, tool rail, project, blocks and colour panels
│   ├── kits/             Kit player, hologram scene, thumbnails, badges, confetti
│   ├── figures/          BlockFigureMesh, SVG FigureIcon, Figure Lab, ID card
│   ├── sets/             Set Explorer, comparison and wish list modals, range slider
│   └── three/            Shared scene lighting and camera rig
├── data/                 Brick catalog, starter kits, figure parts, featured sets
├── lib/
│   ├── studio/           Placement rules, geometry, reducer, sharing and cartridges, sound
│   ├── kits/             Step builder, kit validation, badges
│   ├── figures/          Figure defaults, validation, saving, export
│   └── sets/             Search and filtering, wish list
└── types/                BuildProject, PlacedBrick, BlockFigure, BrickSet…
docs/phases/              Implementation plans for each module
scripts/                  Development checks
```

### Units and coordinates

One stud = 1 world unit horizontally. Heights are measured in plate units: a plate is 1 unit (0.4 world units) and a standard brick is 3. A `PlacedBrick`'s `x`/`z` is the stud cell of its minimum corner after rotation, and `y` is its base height in plate units. Rotation is clockwise when viewed from above.

### File formats

- **`.brick.json`:** a full `BuildProject` (bricks, optional figures and baseplate color).
- **`.figure.json`:** a single `BlockFigure`.
- **`dream-set-wishlist.json`:** an exported wish list.
- **`#b=` links:** a bit-packed, base64url encoding of a `BuildProject` (see `src/lib/studio/shareCodec.ts`), about 4 characters per brick. Catalog lists are append-only because links store their indexes. Older lz-string `#build=` links are still read.

Every import is validated against the catalogs, and unknown parts, colors or out-of-bounds pieces are dropped.

## Credits

Set data and thumbnails in the Set Explorer are indexed via [Rebrickable](https://rebrickable.com). The built-in dataset comes from Rebrickable's public data export, and its part counts are Rebrickable's, which can differ slightly from the number printed on the box. Building-instruction links point to LEGO's official instructions service.

## Disclaimer

Builder's Bench is an independent, non-commercial fan project created for educational purposes. Not affiliated with, endorsed, or sponsored by The LEGO Group. LEGO® is a trademark of the LEGO Group of companies. All kits, figures and part designs in the studio, kits and Figure Lab are original to this project.
