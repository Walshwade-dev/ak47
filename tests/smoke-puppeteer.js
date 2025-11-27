const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:4173/'; // vite preview default port
  console.log('Connecting to', url);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('HTTP status:', res.status());

    // Check key selectors
    const selectors = ['#playerHand', '#drawPile', '#startBtn', '#playerHand'];
    for (const sel of selectors) {
      const exists = await page.$(sel) !== null;
      console.log(`${sel}: ${exists ? 'OK' : 'MISSING'}`);
      if (!exists) throw new Error(`Missing selector ${sel}`);
    }

    // Optionally take a screenshot
    await page.screenshot({ path: 'tests/smoke-screenshot.png', fullPage: true });
    console.log('Screenshot saved to tests/smoke-screenshot.png');

    console.log('Smoke test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err.message);
    await browser.close();
    process.exit(2);
  }
})();
