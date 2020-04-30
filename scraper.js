const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const scrape = async (dir, url, progressBar) => {
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      defaultViewport: null,
      headless: true,
    });

    page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const pager = await page.$$('#i2 div div span');
    const totalPage = await (await pager[1].getProperty('textContent')).jsonValue();
    progressBar.setTotal(totalPage*1);

    const isNotEnd = async () => {
      const pager = await page.$$('#i2 div div span');
      const currentPage = await (await pager[0].getProperty('textContent')).jsonValue();
      progressBar.update(currentPage*1);
      return currentPage !== totalPage;
    };

    fs.mkdir(dir, (ignore) => {
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
      fs.writeFileSync(path.join(dir, found[1]), buffer);

      await page.waitForSelector("#i3 a");
      await page.click("#i3 a");
      await page.waitFor("#i2 div div span");

      await page.waitFor(500); // interval
    } while (await isNotEnd());

    return true;
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new RetryError(err, page.url());
    } else {
      console.log("next command:", `node -r dotenv/config index.js ${dir} ${page.url()}\n`);
      throw err;
    }
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

class RetryError extends Error {
  constructor(err, nextUrl) {
    super(err);
    this.name = new.target.name;
    this.nextUrl = nextUrl;
  }

  getNextUrl() {
    return this.nextUrl;
  }
}

module.exports = { scrape, RetryError };

