const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const DIR = process.argv[2];
if (DIR === undefined) {
  console.log("pass the dir");
  return;
}

const TARGET_URL = process.argv[3];
if (TARGET_URL === undefined) {
  console.log("pass the url");
  return;
}

const scrape = async () => {
  let browser;
  let currentPage;
  let totalPage;
  let page;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    page = await browser.newPage();
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });

    const isNotEnd = async () => {
      const pager = await page.$$('#i2 div div span');
      currentPage = await (await pager[0].getProperty('textContent')).jsonValue();
      if (!totalPage) {
        totalPage = await (await pager[1].getProperty('textContent')).jsonValue();
      }
      return currentPage !== totalPage;
    };

    fs.mkdir(DIR, (ignore) => {
      // console.log(ignore)
    });

    do {
      const response = await page.waitForResponse(response => {
        const found = response.url().match(/\.([^.]+?)$/);
        if (found === null) return false;
        return ["jpg", "jpeg", "gif", "png"].includes(found[1]);
      });
      const found = response.url().match(/\/([^\/]+)$/);
      const buffer = await response.buffer();
      fs.writeFileSync(path.join(DIR, found[1]), buffer);

      await page.click("#i3 a");
      await page.waitFor("#i2 div div span");

      await page.waitFor(500); // interval
    } while (await isNotEnd());

    console.log("DONE");
  } catch (err) {
    console.log(err);
    console.log("currentPage: ", currentPage);
    console.log("next command: ", `node ${path.basename(__filename)} ${DIR} ${page.url()}`);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

(async () => {
  await scrape();
})();

