// Tailwind CSS v4 via PostCSS. Works with both Turbopack (local `next dev`)
// and webpack (Spacefast's Next.js build), unlike a Turbopack-only loader rule.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
