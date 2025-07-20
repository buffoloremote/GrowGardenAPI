const puppeteer = require('puppeteer');
const fs = require('fs');

async function getStock() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    console.log('🌱 Navigating to stock page...');
    await page.goto('https://elvebredd.com/grow-a-garden-stock', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await new Promise(res => setTimeout(res, 3000)); // wait for JS to load

    console.log('📊 Scraping data...');
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
    console.error('❌ Error:', err);
    fs.writeFileSync('stock.json', JSON.stringify({
      error: err.message,
      stocks: []
    }, null, 2));
  } finally {
    await browser.close();
  }
}

getStock();
