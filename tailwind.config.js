/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './extensions/diamond-finder-theme-extension/blocks/**/*.liquid',
    './extensions/diamond-finder-theme-extension/snippets/**/*.liquid',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  prefix: 'tw-',
}

