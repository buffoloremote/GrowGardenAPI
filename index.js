const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STOCK_URL = 'https://elvebredd.com/grow-a-garden-stock';
const OUTPUT_FILE = path.join(__dirname, 'stock.json');
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

let lastStockData = null;

async function scrapeStock() {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(STOCK_URL, { waitUntil: 'domcontentloaded' });

    const stockData = await page.evaluate(() => {
      const data = [];

      document.querySelectorAll('.product-card').forEach(card => {
        const name = card.querySelector('h2, h3, h1')?.textContent?.trim() || 'Unnamed';
        const qtyMatch = card.textContent.match(/(\d+)\s*(left|remaining|available|in stock)/i);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : null;
        data.push({ name, quantity });
      });

      return data;
    });

    await browser.close();

    const changed = JSON.stringify(stockData) !== JSON.stringify(lastStockData);

    if (changed) {
      lastStockData = stockData;

      const output = {
        updatedAt: new Date().toISOString(),
        nextRefreshInMinutes: REFRESH_INTERVAL_MS / 60000,
        stock: stockData
      };

      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
      console.log(`✅ Updated stock.json at ${new Date().toLocaleTimeString()}`);
    } else {
      console.log(`⏸ No change in stock at ${new Date().toLocaleTimeString()}`);
    }
  } catch (error) {
    console.error('❌ Scraping error:', error);
  }
}

async function loop() {
  while (true) {
    await scrapeStock();
    console.log(`⏳ Waiting ${REFRESH_INTERVAL_MS / 60000} minutes before checking again...\n`);
    await new Promise(resolve => setTimeout(resolve, REFRESH_INTERVAL_MS));
  }
}

loop();
