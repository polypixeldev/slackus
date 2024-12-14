import prettyms from "pretty-ms";

import type { App, Check } from "@prisma/client";

export function calculateUptime(app: App & { checks: Check[] }) {
  const currentStatus = app.checks.at(-1)?.status;

  let changeDate: Date | null = null;
  const sortedChecks = app.checks.sort(
    (a, b) => b.timestamp.valueOf() - a.timestamp.valueOf(),
  );
  for (let i = 0; i < sortedChecks.length; i++) {
    if (sortedChecks[i].status !== currentStatus) {
      if (i === 0) {
        changeDate = new Date();
      } else {
        const changeCheck = sortedChecks[i - 1];
        changeDate = changeCheck.timestamp;
      }

      break;
    }
  }

  let duration;
  if (!changeDate) {
    duration = Infinity;
  } else {
    duration = new Date().valueOf() - changeDate.valueOf();
  }

  // 30 days
  const AVG_INTERVAL = 30 * 24 * 60 * 60 * 1000;

  let upMillis = 0;
  let totalMillis = 0;

  let lastCheck = new Date().valueOf();
  for (const check of sortedChecks) {
    if (new Date().valueOf() - check.timestamp.valueOf() >= AVG_INTERVAL) break;

    const elapsed = lastCheck - check.timestamp.valueOf();

    if (check.status === "up") {
      upMillis += elapsed;
      totalMillis += elapsed;
    } else if (check.status === "down") {
      totalMillis += elapsed;
    }

    lastCheck = check.timestamp.valueOf();
  }

  const avg = (upMillis / totalMillis) * 100;

  return `${currentStatus?.toUpperCase()} for *${
    duration === Infinity
      ? "all time"
      : prettyms(duration, {
          unitCount: 2,
        })
  }*, average *${avg.toFixed(2)}%*`;
}
