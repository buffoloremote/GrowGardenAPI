const puppeteer = require("puppeteer");
const fs = require("fs");

async function getStock() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://theriagames.com/guide/grow-a-garden-stock-tracker', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait 7 seconds to allow full data to load
    await page.waitForTimeout(7000);

    const stocks = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll(".item-card");

      cards.forEach((card) => {
        const name = card.querySelector("h3")?.innerText.trim();
        const match = card.innerText.match(/x(\d+)/);
        const quantity = match ? parseInt(match[1], 10) : 0;

        if (name && quantity > 0) {
          items.push({ name, quantity });
        }
      });

      return items;
    });

    fs.writeFileSync("stock.json", JSON.stringify({ stocks }, null, 2));
    console.log("✅ Saved to stock.json:", stocks);
  } catch (err) {
    console.error("❌ Error:", err);
    fs.writeFileSync("stock.json", JSON.stringify({ error: "Failed to fetch stock data" }, null, 2));
  } finally {
    await browser.close();
  }
}

getStock();
