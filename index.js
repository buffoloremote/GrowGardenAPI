const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function getStock() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://theriagames.com/guide/grow-a-garden-stock-tracker', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Scroll down to trigger lazy-load (simulate being visible)
    await page.evaluate(() => {
      window.scrollBy(0, 500);
    });

    // Wait for grid to appear
    await page.waitForSelector('div.grid', { timeout: 30000 });

    // Give time for content inside to load
    await page.waitForTimeout(5000);

    const stocks = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('div.grid > div').forEach((card) => {
        const name = card.querySelector('h3')?.innerText.trim();
        const quantityText = card.innerText.match(/x\\d+/)?.[0] || 'x0';
        const quantity = parseInt(quantityText.replace('x', ''), 10);

        if (name && quantity > 0) {
          items.push({ name, quantity });
        }
      });
      return items;
    });

    fs.writeFileSync('stock.json', JSON.stringify({ stocks }, null, 2));
    console.log('✅ Saved to stock.json:', stocks);
  } catch (err) {
    const html = await page.content();
    fs.writeFileSync('error-dump.html', html);
    console.error('❌ Error:', err);
    fs.writeFileSync('stock.json', JSON.stringify({ error: 'Failed to fetch stock data' }, null, 2));
  } finally {
    await browser.close();
  }
}

getStock();
