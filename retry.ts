import { RetryError } from './scraper';
import { ProgressBar } from './progressbar';

const sleep = (ms: number) => new Promise((resolve, reject) => setTimeout(resolve, ms));

type RetryParams = {
  dir: string;
  url: string;
  progressBar: ProgressBar;
  proc: (dir: string, url: string, progressBar: ProgressBar) => Promise<boolean>;
  onSuccess: () => void;
  options?: {};
}
export const retry = async ({ dir, url, progressBar, proc, onSuccess, options }: RetryParams) => {
  while (true) {
    try {
      const done = await proc(dir, url, progressBar);
      if (done) {
        onSuccess();
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
};
