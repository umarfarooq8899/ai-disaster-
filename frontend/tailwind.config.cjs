module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        danger: "#EF4444",
        moderate: "#F97316",
        safe: "#10B981",
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
