import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["DM Sans", "sans-serif"], mono: ["DM Mono", "monospace"] },
      colors: {
        brand: { DEFAULT: "#1A1A1A", accent: "#6C63FF", success: "#1B9B6F", danger: "#E24B4A" },
        surface: { DEFAULT: "#FAFAF8", card: "#FFFFFF", border: "#E5E3DC" },
      },
    },
  },
  plugins: [],
}
export default config
