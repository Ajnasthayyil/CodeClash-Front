/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        codeclash: {
          green: '#00EA64',
          dark: '#060814',
        }
      }
    },
  },
  plugins: [],
}
