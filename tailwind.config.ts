import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08111f",
        foreground: "#f7f3e8",
        card: "rgba(12, 23, 39, 0.72)",
        border: "rgba(255, 194, 102, 0.18)",
        amber: {
          300: "#f6c971",
          400: "#efb34a",
          500: "#d89028",
        },
        success: "#56c288",
        danger: "#ef6461",
        muted: "#9ca7ba",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        glass: "0 18px 50px rgba(0, 0, 0, 0.28)",
      },
      backgroundImage: {
        detective:
          "radial-gradient(circle at top, rgba(240,180,80,0.12), transparent 35%), linear-gradient(135deg, rgba(10,20,35,0.96), rgba(4,10,18,1))",
      },
    },
  },
  plugins: [],
};

export default config;
