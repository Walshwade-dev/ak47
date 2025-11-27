const fs = require('fs');
const path = require('path');

(function () {
  const htmlPath = path.resolve(__dirname, '../dist/index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('dist/index.html not found — run npm run build first');
    process.exit(2);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const selectors = ['#playerHand', '#drawPile', '#startBtn', '#playerHand'];
  let ok = true;
  for (const sel of selectors) {
    if (html.indexOf(sel) === -1) {
      console.error(`${sel}: MISSING`);
      ok = false;
    } else {
      console.log(`${sel}: OK`);
    }
  }

  if (!ok) {
    console.error('Smoke test failed');
    process.exit(2);
  }

  console.log('Smoke test passed');
  process.exit(0);
})();
