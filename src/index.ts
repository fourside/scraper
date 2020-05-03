import { parse } from "./cliparser";
import { progressBar } from "./progressbar";
import { retry } from "./retry";
import { scrape } from "./scraper";
import { logger } from "./logger";

const { dir, url } = parse(process.argv);

if (!process.env.CHROME_PATH) {
  console.log("pass option: '-r dotent/config' or pass the right path of chrome in .env");
  process.exit(-1);
}

(async () => {
  logger.info("start");
  logger.info("passed args: [%s, %s]", dir, url);
  progressBar.start(100, 0);
  const proc = scrape;
  try {
    await retry({ dir, url, progressBar, proc });
  } catch (err) {
    logger.error(err);
  }
  progressBar.stop();
  logger.info("end");
})();
