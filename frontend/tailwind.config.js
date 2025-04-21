const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        card: "var(--card-bg)",
        success: "var(--success)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
