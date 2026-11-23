import colors from 'tailwindcss/colors';
export default { content: ['./index.html','./src/**/*.{js,jsx}'], theme: { extend: {
  fontFamily: { display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'], sans: ['Figtree', 'system-ui', 'sans-serif'] },
  colors: {
    slate: colors.stone,
    brand: { 50:'#eef1f7', 100:'#dde3ef', 600:'#1f3a68', 700:'#172c52', 900:'#0f1f3d' },
    sand: { 50:'#faf6ee', 100:'#f3ece0', 200:'#e8dcc6', 300:'#d9c7a3', 500:'#b8995f' } } } }, plugins: [] };
