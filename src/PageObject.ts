import fs from "fs";
import path from "path";
import puppeteer, { Browser, Page, Response } from "puppeteer-core";
import { fileLogger as logger } from "./logger";

export async function launch() {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    defaultViewport: null,
    headless: true,
  });
  const page = await browser.newPage();
  return new PageObject(browser, page);
}

const LIMIT_BYTE_SIZE = 1024 * 16;
export class PageObject {
  constructor(private browser: Browser, private page: Page) {}

  async goto(url: string) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
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

  async saveMedia(dir: string) {
    const response = await this.page.waitForResponse(this.isMediaResponse);
    const fileName = response.url().split("/").pop() || "url_must_be_delimited_by_slash";
    const buffer = await response.buffer();
    if (buffer.length > LIMIT_BYTE_SIZE) {
      fs.writeFileSync(path.join(dir, fileName), buffer);
      logger.debug("saved: [%s, size: %s]", fileName, buffer.length);
    }
  }

  async next() {
    await this.page.waitForSelector("#i3 a");
    await this.page.click("#i3 a");
    await this.page.waitFor("#i2 div div span");
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

  private async getPager() {
    return await this.page.$$("#i2 div div span");
  }

  private isMediaResponse(response: Response) {
    // logger.debug("response url: [%s]", response.url());
    const found = response.url().match(/\.([^.]+?)$/);
    if (found === null) return false;
    return ["jpg", "jpeg", "gif", "png", "mp4"].includes(found[1]);
  }

}
