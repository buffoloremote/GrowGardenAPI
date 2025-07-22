const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STOCK_URL = 'https://elvebredd.com/grow-a-garden-stock';
const OUTPUT_FILE = path.join(__dirname, 'stock.json');
const REFRESH_INTERVAL_MINUTES = 5;

let previousStock = [];

async function scrapeStock() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(STOCK_URL, { waitUntil: 'domcontentloaded' });

  const stockData = await page.evaluate(() => {
    const data = [];
    const productRows = document.querySelectorAll('.flex.flex-wrap > div');

    productRows.forEach(row => {
      const name = row.querySelector('h2')?.textContent.trim();
      const quantityText = row.querySelector('p')?.textContent || '';
      const quantityMatch = quantityText.match(/(\d+)/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;

      if (name) {
        data.push({ name, quantity });
      }
    });

    return data;
  });

  await browser.close();
  return stockData;
}

function stocksAreEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function saveStockToFile(stock) {
  const payload = {
    updatedAt: new Date().toISOString(),
    nextRefreshInMinutes: REFRESH_INTERVAL_MINUTES,
    stock
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));
}

async function loop() {
  while (true) {
    try {
      const stock = await scrapeStock();

      if (!stocksAreEqual(stock, previousStock)) {
        await saveStockToFile(stock);
        previousStock = stock;
        console.log(`✅ Updated stock.json at ${new Date().toLocaleTimeString()} with ${stock.length} items`);
      } else {
        console.log(`⏸ No change in stock at ${new Date().toLocaleTimeString()}`);
      }
    } catch (error) {
      console.error('❌ Scraping error:', error);
    }

    console.log(`⏳ Waiting ${REFRESH_INTERVAL_MINUTES} minutes before checking again...\n`);
    await new Promise(res => setTimeout(res, REFRESH_INTERVAL_MINUTES * 60 * 1000));
  }
}

loop();
