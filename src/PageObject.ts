import fs from "fs";
import path from "path";
import puppeteer, { Browser, Page, Response } from "puppeteer-core";
import { fileLogger as logger } from "./logger";

export async function launch(dir: string) {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    defaultViewport: null,
    headless: true,
  });
  const page = await browser.newPage();
  return new PageObject(browser, page, dir);
}

const LIMIT_BYTE_SIZE = 1024 * 16;
export class PageObject {
  constructor(private browser: Browser, private page: Page, private dir: string) {
  }

  async goto(url: string) {
    try {
      this.page.on("response", this.saveImageHandler);
      await Promise.all([
        this.page.goto(url, { waitUntil: ["domcontentloaded", "networkidle2"] }),
        this.page.waitForNavigation({ waitUntil: ["load", "networkidle2"]}),
      ]);
    } catch (err) {
      logger.error("goto error:", err);
    }
  }

  async getTotalPage() {
    const pager = await this.getPager();
    const totalPage = await (await pager[1].getProperty("textContent")).jsonValue();
    return parseInt(totalPage + "");
  }

  async getCurrentPage() {
    const pager = await this.getPager();
    const currentPage = await (await pager[0].getProperty("textContent")).jsonValue();
    return parseInt(currentPage + "");
  }

  async next() {
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: ["load", "networkidle2"]}),
        this.page.waitForSelector("#i3 a"),
        this.page.click("#i3 a"),
      ]);
      await this.page.waitFor("#i2 div div span");
    } catch (err) {
      // ignore navigation timeout error
    }
  }

  async waitFor(msec: number) {
    await this.page.waitFor(msec);
  }

  url() {
    return this.page.url();
  }

  async close() {
    this.browser.close();
  }

  private saveImageHandler = async (response: Response) => {
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
