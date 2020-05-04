import { ProgressBar } from "./progressbar";
import { RetryError } from "./RetryError";
import { PageObject, launch } from "./PageObject";

export const scrape = async (dir: string, url: string, progressBar: ProgressBar) => {
  let pageObject: PageObject | undefined;
  try {
    pageObject = await launch();
    await pageObject.goto(url);

    const totalPage = await pageObject.getTotalPage();
    if (totalPage !== progressBar.getTotal()) {
      progressBar.setTotal(totalPage);
    }
    let currentPage = 0;
    do {
      await pageObject.saveMedia(dir);
      currentPage = await pageObject.getCurrentPage();
      progressBar.update(currentPage);

      await pageObject.next();
      await pageObject.waitFor(500); // interval
    } while (currentPage !== totalPage);

    return true;
  } catch (err) {
    if (err.name === "TimeoutError" && pageObject) {
      throw new RetryError(err, pageObject.url());
    } else {
      console.log("next command:", `npm start -- ${dir} ${pageObject?.url()}\n`);
      throw err;
    }
  } finally {
    await pageObject?.close();
  }
};
