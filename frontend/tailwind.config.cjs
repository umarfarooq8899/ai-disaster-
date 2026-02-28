module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: "#f0f9ff", // Lighter, cleaner blue
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9", // Sky blue for a modern feel
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        danger: "var(--danger)",
        moderate: "var(--moderate)",
        safe: "var(--safe)",
      },
      backgroundImage: {
        "blue-white": "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)", // Much subtler
        "blue-glow": "radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.15) 0%, rgba(255, 255, 255, 0) 50%)",
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)", // Softer
        glow: "0 0 15px rgba(14, 165, 233, 0.3)",
      },
    },
  },
  plugins: [],
};
