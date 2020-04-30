const { program } = require('commander');
const { scrape } = require('./scraper');

let targetDir;
let targetUrl;

program
  .version('1.0.0')
  .arguments('<dir> <url>')
  .action(function (dir, url) {
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

(async () => {
  await scrape(targetDir, targetUrl);
})();
