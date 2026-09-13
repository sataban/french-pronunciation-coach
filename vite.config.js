import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work when hosted in a subfolder,
// which is how GitHub Pages serves project sites
// (e.g. https://username.github.io/repo-name/).
// If you deploy to Vercel/Netlify at a root domain, "./" still works fine.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
