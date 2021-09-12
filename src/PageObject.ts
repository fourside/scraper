import fs from "fs";
import path from "path";
import puppeteer, { Browser, Page, HTTPResponse } from "puppeteer-core";
import { fileLogger as logger } from "./logger";

export async function launch(dir: string) {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    defaultViewport: null,
    headless: true,
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0");
  return new PageObject(browser, page, dir);
}

const LIMIT_BYTE_SIZE = 1024 * 16;
export class PageObject {
  constructor(private browser: Browser, private page: Page, private dir: string) {}

  async goto(url: string) {
    try {
      this.page.on("response", this.saveImageHandler);
      await Promise.all([
        this.page.goto(url, {
          waitUntil: ["domcontentloaded", "networkidle2"],
        }),
        this.page.waitForNavigation({ waitUntil: ["load", "networkidle2"] }),
      ]);
    } catch (err) {
      logger.error("goto error:", err);
    }
  }

  async getTotalPage() {
    const pager = await this.getPager();
    const totalText = await pager[1].getProperty("textContent");
    if (totalText === undefined) {
      throw new Error("");
    }
    const totalPage = await totalText.jsonValue();
    return parseInt(totalPage + "");
  }

  async getCurrentPage() {
    const pager = await this.getPager();
    const currentText = await pager[0].getProperty("textContent");
    if (currentText === undefined) {
      throw new Error("");
    }
    const currentPage = await currentText.jsonValue();
    return parseInt(currentPage + "");
  }

  async next() {
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: ["load", "networkidle2"] }),
        this.page.waitForSelector("#i3 a"),
        this.page.click("#i3 a"),
      ]);
      await this.page.waitForSelector("#i2 div div span");
    } catch (err) {
      // ignore navigation timeout error
    }
  }

  async waitForTimeout(msec: number) {
    const jitter = Math.floor(Math.random() * 3000);
    await this.page.waitForTimeout(msec + jitter);
  }

  url() {
    return this.page.url();
  }

  async close() {
    this.browser.close();
  }

  private saveImageHandler = async (response: HTTPResponse) => {
    try {
      if (response.request().resourceType() !== "image") {
        return;
      }
      const buffer = await response.buffer();
      if (buffer.length < LIMIT_BYTE_SIZE) {
        // may be beacon or spacer gif
        return;
      }
      const fileName = response.url().split("/").pop() || "url_must_be_delimited_by_slash";
      fs.writeFileSync(path.join(this.dir, fileName), buffer);
      logger.debug("saved: [%s, size: %s]", fileName, buffer.length);
    } catch (err) {
      logger.error("in save handler:", err);
    }
  };

  private async getPager() {
    return await this.page.$$("#i2 div div span");
  }
}
