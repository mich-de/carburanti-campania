/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#003c7f",
          gold: "#e69900",
          green: "#059669",
          red: "#dc2626",
          dark: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
