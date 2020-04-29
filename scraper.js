const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');
const _colors = require('colors');

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

const progressBar = new cliProgress.SingleBar({}, {
    format: _colors.grey(' {bar}') + ' {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
});

const scrape = async () => {
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      headless: true,
    });

    page = await browser.newPage();
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });

    const pager = await page.$$('#i2 div div span');
    const totalPage = await (await pager[1].getProperty('textContent')).jsonValue();
    progressBar.start(totalPage, 0);

    const isNotEnd = async () => {
      const pager = await page.$$('#i2 div div span');
      const currentPage = await (await pager[0].getProperty('textContent')).jsonValue();
      progressBar.update(currentPage*1);
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

    console.log("\nDONE");
  } catch (err) {
    console.log(err);
    console.log("next command:", `node -r dotenv/config ${path.basename(__filename)} ${DIR} ${page.url()}`);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
    progressBar.stop();
  }
};

(async () => {
  await scrape();
})();

