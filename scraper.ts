import puppeteer, { Browser, Page } from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { Bar } from "cli-progress";

export const scrape = async (dir: string, url: string, progressBar: Bar) => {
  let browser: Browser | undefined;
  let page: Page | undefined;
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
    if (totalPage !== progressBar.getTotal() && typeof totalPage === "string") {
      progressBar.setTotal(parseInt(totalPage));
    }

    const isNotEnd = async (page: Page) => {
      const pager = await page.$$('#i2 div div span');
      const currentPage = await (await pager[0].getProperty('textContent')).jsonValue();
      if (typeof currentPage === "string") {
        progressBar.update(parseInt(currentPage));
      }
      return currentPage !== totalPage;
    };

    fs.mkdir(dir, () => {});

    do {
      const response = await page.waitForResponse(response => {
        const found = response.url().match(/\.([^.]+?)$/);
        if (found === null) return false;
        return ["jpg", "jpeg", "gif", "png"].includes(found[1]);
      });
      const fileName = response.url().split("/").pop() || "url_must_be_delimited_by_slash";
      const buffer = await response.buffer();
      fs.writeFileSync(path.join(dir, fileName), buffer);

      await page.waitForSelector("#i3 a");
      await page.click("#i3 a");
      await page.waitFor("#i2 div div span");

      await page.waitFor(500); // interval
    } while (await isNotEnd(page));

    return true;
  } catch (err) {
    if (err.name === "TimeoutError" && page) {
      throw new RetryError(err, page.url());
    } else {
      console.log("next command:", `npm start -- ${dir} ${page?.url()}\n`);
      throw err;
    }
  } finally {
    if (browser !== undefined) {
      await browser.close();
    }
  }
};

export class RetryError extends Error {
  constructor(private err: any, private nextUrl: string) {
    super(err);
    this.name = new.target.name;
  }

  getNextUrl() {
    return this.nextUrl;
  }
}
