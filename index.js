const puppeteer = require("puppeteer");
const fs = require("fs");

async function getStock() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    await page.goto("https://theriagames.com/guide/grow-a-garden-stock-tracker", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Simulate user activity to trigger stock table load
    await page.evaluate(() => {
      window.focus();
    });

    await page.mouse.move(100, 100);
    await page.mouse.wheel({ deltaY: 100 });
    await page.waitForTimeout(5000); // Give time for site JS to react

    // Wait for table container (if it loads)
    await page.waitForSelector(".grid", { timeout: 10000 });

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
