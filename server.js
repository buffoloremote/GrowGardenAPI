const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/stock', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
  headless: false, // 👈 shows browser so we can debug
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});


    const page = await browser.newPage();
    await page.goto('https://theriagames.com/guide/grow-a-garden-stock-tracker/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForSelector('.stock-item', { timeout: 20000 });

    const stocks = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.stock-item'));
      return items.map(item => {
        const name = item.querySelector('img')?.alt?.trim() || 'Unknown';
        const qtyText = item.querySelector('.quantity-badge')?.innerText || 'x0';
        const quantity = parseInt(qtyText.replace(/[^0-9]/g, ''), 10);
        return { name, quantity };
      });
    });

    await browser.close();
    res.json({ stocks });
  } catch (err) {
    console.error('❌ FULL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}/api/stock`);
});
