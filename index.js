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

    // Wait up to 20 seconds for .grid to show up
    await page.waitForSelector(".grid", { timeout: 20000 });

    // ⏱️ Extra delay to give the JS time to load stock inside the grid
    await new Promise(resolve => setTimeout(resolve, 5000));

    const stocks = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll("div.grid > div");

      cards.forEach((card) => {
        const name = card.querySelector("h3")?.innerText.trim();
        const quantityText = card.innerText.match(/x\d+/)?.[0] || "x0";
        const quantity = parseInt(quantityText.replace("x", ""), 10);

        if (name && quantity > 0) {
          items.push({ name, quantity });
        }
      });

      return items;
    });

    if (stocks.length === 0) {
      throw new Error("Page loaded but no stock found. Might be empty or too slow.");
    }

    fs.writeFileSync("stock.json", JSON.stringify({ stocks }, null, 2));
    console.log("✅ Saved to stock.json:", stocks);
  } catch (err) {
    const html = await page.content();
    fs.writeFileSync("error-dump.html", html); // Save what loaded for debugging
    console.error("❌ Error:", err);
    fs.writeFileSync("stock.json", JSON.stringify({ error: "Failed to fetch stock data" }, null, 2));
  } finally {
    await browser.close();
  }
}

getStock();
