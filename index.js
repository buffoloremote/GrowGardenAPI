const fs = require('fs');
const puppeteer = require('puppeteer');

async function getStock() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://elvebredd.com/grow-a-garden-stock', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(3000);

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
    console.log('✅ Stock saved.');
  } catch (err) {
    console.error('❌ Error:', err);
    fs.writeFileSync('stock.json', JSON.stringify({ error: err.message, stocks: [] }, null, 2));
  } finally {
    await browser.close();
  }
}

getStock();
