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
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
