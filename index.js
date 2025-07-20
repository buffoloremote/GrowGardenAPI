const fs = require('fs');
const { chromium } = require('playwright');

async function scrapeStock() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🌱 Navigating to stock page...');
  await page.goto('https://elvebredd.com/grow-a-garden-stock', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await page.waitForTimeout(3000); // give JS time to load

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
  console.log(`✅ Saved ${stocks.length} items to stock.json`);

  await browser.close();
}

// 🔁 Refresh every 5 minutes (300,000 ms)
async function loop() {
  while (true) {
    try {
      await scrapeStock();
    } catch (err) {
      console.error('❌ Scraping error:', err);
    }

    console.log('⏳ Waiting 5 minutes before next scrape...');
    await new Promise(res => setTimeout(res, 5 * 60 * 1000));
  }
}

loop();
