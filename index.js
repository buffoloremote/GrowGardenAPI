const puppeteer = require("puppeteer");

async function getStock() {
  const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
});

  const page = await browser.newPage();

  console.log("🌱 Navigating to page...");
  await page.goto("https://elvebredd.com/grow-a-garden-stock", {
    waitUntil: "networkidle0",
    timeout: 60000
  });

  console.log("⏳ Waiting for .stock elements to load...");
  await page.waitForSelector(".stock", { timeout: 30000 });

  console.log("📊 Scraping stock data...");
  const stocks = await page.evaluate(() => {
    const results = [];
    const stockSections = document.querySelectorAll(".stock");

    stockSections.forEach(section => {
      const items = section.querySelectorAll(".item");
      items.forEach(item => {
        const name = item.querySelector("p")?.innerText?.trim();
        const img = item.querySelector("img")?.src;
        if (name && img) {
          results.push({ name, image: img });
        }
      });
    });

    return results;
  });

  const fs = require("fs");
  fs.writeFileSync("stock.json", JSON.stringify({ stocks }, null, 2));
  console.log(`✅ Saved to stock.json: ${JSON.stringify(stocks, null, 2)}`);

  await browser.close();
}

getStock().catch(err => {
  console.error("❌ Error:", err);
});
