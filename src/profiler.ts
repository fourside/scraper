import { performance } from "perf_hooks";

const { locale } = Intl.DateTimeFormat().resolvedOptions();

export const start = () => {
  return performance.now();
};

export const end = (past: number) => {
  const now = performance.now();
  const msec = now - past;
  const d = new Date(0);
  d.setMilliseconds(msec);
  return d.toLocaleTimeString(locale, {
    timeZone: "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
