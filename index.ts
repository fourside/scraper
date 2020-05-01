import { parse } from "./cliparser";
import { progressBar } from './progressbar';
import { scrape, RetryError } from './scraper';

let { dir, url } = parse(process.argv);

if (!process.env.CHROME_PATH) {
  console.log("pass option: '-r dotent/config' or pass the right path of chrome in .env");
  process.exit(-1);
}

const sleep = (ms: number) => new Promise((resolve, reject) => setTimeout(resolve, ms));

(async () => {
  progressBar.start(100, 0);
  while (true) {
    try {
      const done = await scrape(dir, url, progressBar);
      if (done) {
        console.log("\nDONE");
        break;
      }
    } catch (err) {
      if (err instanceof RetryError) {
        url = err.getNextUrl();
        await sleep(2000);
      } else {
        console.log(err);
        throw err;
      }
    }
  }
  progressBar.stop();
})();
