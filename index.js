const puppeteer = require("puppeteer");
const fs = require("fs");

async function getStock() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    // Load the Grow a Garden stock tracker page
    await page.goto('https://theriagames.com/guide/grow-a-garden-stock-tracker', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Wait for product grid to appear (not just the table)
    await page.waitForSelector("div.grid > div", { timeout: 15000 });

    // Scrape the stock items
    const stocks = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll("div.grid > div").forEach((card) => {
        const name = card.querySelector("h3")?.innerText.trim();
        const quantityText = card.innerText.match(/x\d+/)?.[0] || "x0";
        const quantity = parseInt(quantityText.replace("x", ""), 10);

        if (name && quantity > 0) {
          items.push({ name, quantity });
        }
      });
      return items;
    });

    // Save to stock.json
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
