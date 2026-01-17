module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        },
        danger: "var(--danger)",
        moderate: "var(--moderate)",
        safe: "var(--safe)",
      },
      backgroundImage: {
        "blue-white": "linear-gradient(135deg, #eff6ff 0%, #ffffff 45%, #dbeafe 100%)",
        "blue-glow": "radial-gradient(circle at 20% 0%, rgba(59,130,246,0.25) 0%, rgba(255,255,255,0) 45%)",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(2, 6, 23, 0.08)",
      },
    },
  },
  plugins: [],
};
