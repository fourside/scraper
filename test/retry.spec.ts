import * as assert from "assert";
import { retry } from "../src/retry";
import { ProgressBar as Bar } from "../src/progressbar";
import { RetryError } from "../src/RetryError";

const retryErrorPromise = () => {
  return new Promise<boolean>(() => {
    throw new RetryError("retry error", "dummy url");
  });
};

const errorPromise = () => {
  return new Promise<boolean>(() => {
    throw new Error("ordinal error");
  });
};

describe("retry", () => {
  const defaultParams = {
    dir: "",
    url: "",
    progressBar: {} as Bar,
  };

  let count = 0;
  const until3TimesRetryError = () => {
    return new Promise<boolean>((resolve) => {
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
      minMs: 10,
      maxMs: 50,
    };
    const result = await retry({ ...defaultParams, proc, backoffOptions });
    assert.strictEqual(result, true);
  });

  it("should be rejected when throws Error except RetryError", async () => {
    const proc = errorPromise;
    await assert.rejects(
      () => {
        return retry({ ...defaultParams, proc });
      },
      { name: "Error", message: "ordinal error" }
    );
  });

  it("should be rejected when attempt over limit", async () => {
    const proc = retryErrorPromise;
    const backoffOptions = {
      limit: 3,
      minMs: 10,
      maxMs: 50,
    };
    await assert.rejects(
      () => {
        return retry({ ...defaultParams, proc, backoffOptions });
      },
      { name: "Error", message: "exceeded max retry [3]" }
    );
  });
});
