import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          white: "#FFFFFF",
          navy: "#183153",
          navyHover: "#11243D",
          lightGrey: "#F4F6F8",
          cardBg: "#FAFBFC",
          subtleBorder: "#E2E8F0",
          softBlue: "#EAF1F8",
          softGreen: "#E7F4EA",
          softRed: "#FCE8E6",
          greyText: "#667085",
          darkText: "#183153",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 1px 4px 0 rgba(24, 49, 83, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;

