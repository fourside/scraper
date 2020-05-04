export class RetryError extends Error {
  constructor(private err: any, private nextUrl: string) {
    super(err);
    this.name = new.target.name;
    Object.setPrototypeOf(this, RetryError.prototype);
  }

  getNextUrl() {
    return this.nextUrl;
  }
}
