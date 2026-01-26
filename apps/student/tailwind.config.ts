import type { Config } from "tailwindcss";
import sharedConfig from "@repo/config/tailwind";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [sharedConfig as Config],
  theme: {
    extend: {
      spacing: {
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
        'safe-area-inset-top': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
