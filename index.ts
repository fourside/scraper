import { parse } from "./cliparser";
import { progressBar } from './progressbar';
import { retry } from './retry';
import { scrape } from './scraper';

let { dir, url } = parse(process.argv);

if (!process.env.CHROME_PATH) {
  console.log("pass option: '-r dotent/config' or pass the right path of chrome in .env");
  process.exit(-1);
}

(async () => {
  progressBar.start(100, 0);
  const proc = scrape;
  try {
    await retry({ dir, url, progressBar, proc });
    console.log("\DONE");
  } catch (err) {
    console.log(err);
  }
  progressBar.stop();
})();
