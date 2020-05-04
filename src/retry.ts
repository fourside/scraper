import { format } from "util";
import { ProgressBar } from "./progressbar";
import { fileLogger as logger } from "./logger";
import { RetryError } from "./RetryError";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type RetryParams = {
  dir: string;
  url: string;
  progressBar: ProgressBar;
  proc: (dir: string, url: string, progressBar: ProgressBar) => Promise<boolean>;
  backoffOptions?: BackoffOptions;
}
type BackoffOptions = {
  limit?: number;
  minMs?: number;
  maxMs?: number;
}
const defaultOptions = {
  limit: 1000,
  minMs: 2 * 100,
  maxMs: 10 * 1000,
};

export const retry = async ({ dir, url, progressBar, proc, backoffOptions }: RetryParams) => {
  let attempt = 0;
  const options = Object.assign(defaultOptions, backoffOptions);
  while (attempt++ < options.limit) {
    try {
      const done = await proc(dir, url, progressBar);
      if (done) {
        return done;
      }
    } catch (err) {
      if (err instanceof RetryError) {
        if (attempt >= options.limit) {
          throw new Error(format("exceeded max retry [%s]", attempt));
        }
        url = err.getNextUrl();
        const ms = addJitter(computeSleepMsec(options.minMs, options.maxMs, attempt));
        logger.debug("retry", err);
        logger.info("retry [attempt: %s, nexturl: %s, wait ms: %s]", attempt, url, ms);
        await sleep(ms);
      } else {
        throw err;
      }
    }
  }
};

const computeSleepMsec = (base: number, cap: number, attempt: number) => {
  const factor = 2;
  const ms = base * Math.pow(factor, attempt);
  return Math.min(cap, ms);
};

const addJitter = (msec: number) => {
  const jitter = 0.5;
  return msec + Math.floor(Math.random() * jitter * msec);
};