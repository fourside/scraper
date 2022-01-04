import path from "path";
import { createLogger, format, transports, LoggerOptions } from "winston";

const { combine, timestamp, printf } = format;
const customFormat = printf(({ level, message, datetime }) => {
  return `${datetime} [${level}]: ${message}`;
});

const fileTransporter = new transports.File({
  filename: path.join(__dirname, "../logs", "scraper.log"),
});

const loggerOptions: LoggerOptions = {
  level: process.env.DEBUG === "true" ? "debug" : "info",
  format: combine(format.splat(), timestamp({ format: "YYYY-MM-DD HH:mm:ss", alias: "datetime" }), customFormat),
};

export const logger = createLogger({
  ...loggerOptions,
  transports: [new transports.Console(), fileTransporter],
});

export const fileLogger = createLogger({
  ...loggerOptions,
  transports: [fileTransporter],
});
