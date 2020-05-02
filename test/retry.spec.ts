import * as assert from "assert";
import { retry } from "../retry";
import { ProgressBar as Bar } from '../progressbar';
import { RetryError } from "../scraper";

const retryErrorPromise = (dir: string, url: string, bar: Bar) => {
  return new Promise<boolean>((resolve, reject) => {
    throw new RetryError("retry error", "dummy url");
  });
};

const errorPromise = (dir: string, url: string, bar: Bar) => {
  return new Promise<boolean>((resolve, reject) => {
    throw new Error("ordinal error");
  });
};

describe("retry", () => {
  const defaultParams = {
    dir: "", url: "", progressBar: {} as Bar,
  };

  let count = 0;
  const until3TimesRetryError = (dir: string, url: string, bar: Bar) => {
    return new Promise<boolean>((resolve, reject) => {
      if (count++ > 2) {
        resolve(true);
      } else {
        throw new RetryError("retry", "dummy url");
      }
    });
  };

  beforeEach(() => {
    count = 0;
  });

  it("should be fulfilled when throws RetryError", async () => {
    const proc = until3TimesRetryError;
    const backoffOptions = {
      limit: 4,
    };
    const result = await retry({ ...defaultParams, proc, backoffOptions });
    assert.strictEqual(result, true);
  });

  it("should be rejected when throws Error except RetryError", () => {
    const proc = errorPromise;
    assert.rejects(() => {
      return retry({ ...defaultParams, proc });
    }, { name: 'Error', message: "ordinal error" });
  });

  it("should be rejected when attempt over limit", () => {
    const proc = retryErrorPromise;
    const backoffOptions = {
      limit: 3,
    };
    assert.rejects(() => {
      return retry({ ...defaultParams, proc, backoffOptions });
    }, { name: "Error", message: "exceeded max retry [3]" });
  });

});