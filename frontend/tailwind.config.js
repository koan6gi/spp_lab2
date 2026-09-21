/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        keep: {
          bg: '#f8f9fa',
          surface: '#ffffff',
          border: '#e2e8f0',
          hover: '#f1f5f9',
          primary: '#2563eb',
        },
      },
    },
  },
  plugins: [],
};
