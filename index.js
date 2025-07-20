const puppeteer = require('puppeteer');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStock() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://elvebredd.com/grow-a-garden-stock', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await delay(3000);

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
    console.log('✅ Saved to stock.json');
  } catch (err) {
    console.error('❌ Scrape failed:', err.message);
    fs.writeFileSync('stock.json', JSON.stringify({ stocks: [], error: err.message }, null, 2));
  } finally {
    await browser.close();
  }
}

getStock();
