const puppeteer = require('puppeteer');

async function getStock() {
  const browser = await puppeteer.launch({
    headless: false, // shows the browser for testing
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://theriagames.com/guide/grow-a-garden-stock-tracker/', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // Wait until .stock-item shows up
  await page.waitForSelector('.stock-item', { timeout: 20000 });

  const stocks = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.stock-item'));
    return items.map(item => {
      const name = item.querySelector('img')?.alt?.trim() || 'Unknown';
      const qtyText = item.querySelector('.quantity-badge')?.innerText || 'x0';
      const quantity = parseInt(qtyText.replace(/[^0-9]/g, ''), 10);
      return { name, quantity };
    });
  });

  console.log('📦 STOCKS:', stocks);
  await browser.close();
}

getStock();

