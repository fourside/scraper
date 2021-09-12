import { ProgressBar } from "./progressbar";
import { RetryError } from "./RetryError";
import { PageObject, launch } from "./PageObject";
import { fileLogger as logger } from "./logger";

export const scrape = async (dir: string, url: string, progressBar: ProgressBar) => {
  let pageObject: PageObject | undefined;
  try {
    pageObject = await launch(dir);
    await pageObject.goto(url);

    const totalPage = await pageObject.getTotalPage();
    if (totalPage !== progressBar.getTotal()) {
      progressBar.setTotal(totalPage);
    }
    let currentPage = 0;
    do {
      currentPage = await pageObject.getCurrentPage();
      progressBar.update(currentPage);
      logger.debug("current: [%s / %s at %s]", currentPage, totalPage, pageObject.url());

      await pageObject.next();
      logger.debug("next: [%s]", pageObject.url());
      await pageObject.waitForTimeout(500); // interval
    } while (currentPage !== totalPage);

    return true;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "TimeoutError" && pageObject) {
        throw new RetryError(err, pageObject.url());
      } else {
        console.log("next command:", `npm start -- ${dir} ${pageObject?.url()}\n`);
        throw err;
      }
    }
    throw err;
  } finally {
    await pageObject?.close();
  }
};
