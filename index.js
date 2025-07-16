const puppeteer = require("puppeteer");
const fs = require("fs");

async function getStock() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Block ads and images
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().includes("ads") || request.resourceType() === "image") {
      request.abort();
    } else {
      request.continue();
    }
  });

  try {
    await page.goto("https://growagardenpro.com/stock", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const stock = await page.$eval("pre", (el) => JSON.parse(el.textContent));

    console.log("✅ STOCKS:", stock);

    // Save to stock.json
    fs.writeFileSync("stock.json", JSON.stringify(stock, null, 2));
    console.log("✅ Saved to stock.json");
  } catch (err) {
    console.error("❌ Error:", err);
    fs.writeFileSync("stock.json", JSON.stringify({ error: "Failed to fetch stock data" }, null, 2));
  } finally {
    await browser.close();
  }
}

getStock(); // Run immediately if this script is executed

