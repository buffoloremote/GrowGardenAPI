/**
 * Grow a Garden stock scraper
 *  – Scrapes https://elvebredd.com/grow-a-garden-stock
 *  – Saves the result to stock.json  ( { stocks:[ {name,image} ] } )
 */

const fs = require('fs');
const puppeteer = require('puppeteer');

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function getStock() {
  const browser = await puppeteer.launch({
    headless: true,                                 // headless in CI
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH ||      // set in GitHub Action
      undefined,                                    // let Puppeteer pick locally
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    console.log('🌱 Navigating to page…');
    await page.goto('https://elvebredd.com/grow-a-garden-stock', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // wait a moment for JS to render the items
    await delay(3000);

    console.log('📊 Scraping stock data…');
    const stocks = await page.evaluate(() => {
      const results = [];
      // each shop has class="stock"; items are inside .item
      document.querySelectorAll('.stock').forEach(section => {
        section.querySelectorAll('.item').forEach(item => {
          const name = item.querySelector('p')?.innerText?.trim();
          const img  = item.querySelector('img')?.src;
          if (name && img) results.push({ name, image: img });
        });
      });
      return results;
    });

    fs.writeFileSync('stock.json', JSON.stringify({ stocks }, null, 2));
    console.log('✅ Saved to stock.json:', stocks);
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


  