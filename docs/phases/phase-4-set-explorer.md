# Phase 4: The Giant Brick Set Encyclopedia & Wish List (`/sets`)

## Goal
Build a fast, searchable, filterable catalog of real LEGO® themes and sets powered by the Rebrickable API (with a rich built-in fallback dataset so the page works immediately even before entering a free Rebrickable API key).

## Technical Requirements

### 1. Hybrid Data Layer (`src/app/api/sets/route.ts`)
- Create a Next.js Route Handler that proxies requests to the Rebrickable API v3 (`https://rebrickable.com/api/v3/lego/sets/`) if `process.env.REBRICKABLE_API_KEY` is configured.
- Include clear attribution in the UI (`Set data and thumbnails indexed via Rebrickable`).
- **Zero-Friction Fallback:** Include a curated local dataset (`src/data/featuredSets.ts`) of 60+ iconic sets across Space, Castle, City, Technic, and popular licensed themes (with set numbers, piece counts, release years, themes, and Rebrickable image URLs) so the explorer works out-of-the-box with zero API keys required.

### 2. Multi-Filter Search & Comparison
- **Filters:** Search by name or set number (e.g., `75192`), filter by Theme, Release Year range, and Piece Count slider (`less than 200 pcs` to `5,000+ pcs`).
- **Set Detail Modal:** View high-res set imagery, piece count, theme badge, and a direct outbound link to official building instructions (`https://www.lego.com/service/buildinginstructions/[set_num]`) rather than hosting copyrighted PDFs locally.
- **Side-by-Side Set Comparison:** Select up to 3 sets to compare piece count, year, and scale side-by-side.

### 3. Portable Wish List (Cache-Proof)
- Allow adding sets to a **Dream Set Wish List** with a running total of sets and total brick count.
- Include **"Export Wish List (.json)"** and **"Import Wish List"** buttons so wish lists never get lost to browser cache clears.