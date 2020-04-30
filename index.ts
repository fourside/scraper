import path from 'path';
import { program } from 'commander';
import cliProgress from "cli-progress";
import _colors from 'colors';
import { scrape, RetryError } from './scraper';

let targetDir = "";
let targetUrl = "";

program
  .version('1.0.0')
  .arguments('<dir> <url>')
  .action(function (dir: string, url: string) {
    targetDir = dir;
    targetUrl = url;
  })
  .on("--help", () => {
    console.log(`node -r dotenv/config ${path.basename(__filename)} {dir} {targetUrl}`)
  })
  .parse(process.argv)
  ;

if (!process.env.CHROME_PATH) {
  console.log("pass option: '-r dotent/config' or pass the right path of chrome in .env");
  process.exit(-1);
}

const progressBar = new cliProgress.SingleBar({
    format: _colors.grey(' {bar}') + ' {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
});
progressBar.start(100, 0);

const sleep = (ms: number) => new Promise((resolve, reject) => setTimeout(resolve, ms));

(async () => {
  while (true) {
    try {
      const done = await scrape(targetDir, targetUrl, progressBar);
      if (done) {
        console.log("\nDONE");
        break;
      }
    } catch (err) {
      if (err instanceof RetryError) {
        targetUrl = err.getNextUrl();
        await sleep(2000);
      } else {
        console.log(err);
        throw err;
      }
    }
  }
  progressBar.stop();
})();
