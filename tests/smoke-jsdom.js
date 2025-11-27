const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

(async () => {
  try {
    const htmlPath = path.resolve(__dirname, '../dist/index.html');
    if (!fs.existsSync(htmlPath)) {
      console.error('dist/index.html not found — run npm run build first');
      process.exit(2);
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const selectors = ['#playerHand', '#drawPile', '#startBtn', '#playerHand'];
    let allOk = true;
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      console.log(`${sel}: ${el ? 'OK' : 'MISSING'}`);
      if (!el) allOk = false;
    }

    if (!allOk) {
      console.error('Smoke (jsdom) test failed');
      process.exit(2);
    }

    console.log('Smoke (jsdom) test passed');
    process.exit(0);
  } catch (err) {
    console.error('Error running jsdom smoke test:', err);
    process.exit(2);
  }
})();
