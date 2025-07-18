const puppeteer = require("puppeteer-extra");
const fs = require("fs");

async function getStock() {
  const browser = await puppeteer.launch({
    headless: "new",
    channel: "chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://theriagames.com/guide/grow-a-garden-stock-tracker", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForSelector("table.table-striped", { timeout: 30000 });

    const stocks = await page.evaluate(() => {
      const items = [];
      const rows = document.querySelectorAll("table.table-striped tbody tr");
      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length >= 2) {
          const name = cols[0].innerText.trim();
          const quantity = parseInt(cols[1].innerText.replace("x", ""), 10);
          if (name && quantity > 0) {
            items.push({ name, quantity });
          }
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
