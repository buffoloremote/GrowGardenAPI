const fs = require('fs');
const { chromium } = require('playwright');

async function getStock() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🌱 Navigating to stock page...');
  await page.goto('https://elvebredd.com/grow-a-garden-stock', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  // Give JS time to render the elements
  await page.waitForTimeout(3000);

  console.log('📊 Scraping stock data...');
  const stocks = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('.stock').forEach(section => {
      section.querySelectorAll('.item').forEach(item => {
        const name = item.querySelector('p')?.innerText?.trim();
        const img = item.querySelector('img')?.src;
        if (name && img) results.push({ name, image: img });
      });
    });
    return results;
  });

  fs.writeFileSync('stock.json', JSON.stringify({ stocks }, null, 2));
  console.log('✅ Saved stock.json with', stocks.length, 'items.');

  await browser.close();
}

getStock();
