const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STOCK_URL = 'https://elvebredd.com/grow-a-garden-stock';
const OUTPUT_FILE = path.join(__dirname, 'stock.json');
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms

let lastStockSnapshot = null;

async function scrapeStock() {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(STOCK_URL, { waitUntil: 'domcontentloaded' });

    // Get both item names and quantities if available
    const stockData = await page.evaluate(() => {
      const data = [];
      const containers = document.querySelectorAll('.product, .stock-item, .stock-entry');

      containers.forEach(el => {
        const name = el.querySelector('h1, h2, h3, p')?.textContent?.trim();
        const quantityMatch = el.textContent.match(/(\d+)\s*(available|in stock)/i);
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;

        if (name) {
          data.push({ name, quantity });
        }
      });

      return data;
    });

    // Only update file if stock has changed
    const stockChanged = JSON.stringify(stockData) !== JSON.stringify(lastStockSnapshot);
    if (stockChanged) {
      lastStockSnapshot = stockData;
      const output = {
        updatedAt: new Date().toISOString(),
        nextRefreshInMinutes: 5,
        stock: stockData,
      };
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
      console.log(`✅ Updated stock.json at ${new Date().toLocaleTimeString()}`);
    } else {
      console.log(`⏸ No change in stock at ${new Date().toLocaleTimeString()}`);
    }

    await browser.close();
  } catch (error) {
    console.error('❌ Scraping error:', error);
  }
}

async function loop() {
  while (true) {
    await scrapeStock();
    console.log('⏳ Waiting 5 minutes before checking again...\n');
    await new Promise(resolve => setTimeout(resolve, REFRESH_INTERVAL));
  }
}

loop();
