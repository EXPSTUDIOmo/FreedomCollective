/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/*.html", "./public/js/*.js"],
  theme: {
    extend: { 
      fontFamily: {
       Mynerve: ['Mynerve', 'serif'],
       Baskervville: ['Baskervville', 'serif'],
       Luckiest: ['Luckiest', 'serif'],
       Sanchez: ['Sanchez', 'sans-serif'],
       InterTight: ['InterTight', 'sans-serif']
    },
  },
  },
  plugins: [],
}

