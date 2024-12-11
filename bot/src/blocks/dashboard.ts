import prettyms from "pretty-ms";

import type { App, Check } from "@prisma/client";

export default function dashboard(
  apps: (App & { botUser: string; checks: Check[] })[],
) {
  return {
    type: "home" as const,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Slackus Dashboard",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Here are all of your Slackus apps!",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Create new app",
            emoji: true,
          },
          style: "primary",
          action_id: "newApp",
        },
      },
      {
        type: "divider",
      },
      ...apps.map((app) => {
        let text;
        if (app.checks.length === 0) {
          text = `⏰ <@${app.botUser}>: No checks run yet`;
        } else {
          const currentStatus = app.checks.at(-1)?.status;
          let statusEmoji;

          switch (currentStatus) {
            case "up": {
              statusEmoji = "🟢";
              break;
            }
            case "down": {
              statusEmoji = "🛑";
              break;
            }
            default: {
              statusEmoji = "❓️";
              break;
            }
          }

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
            if (
              new Date().valueOf() - check.timestamp.valueOf() >=
              AVG_INTERVAL
            )
              break;

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

          text = `${statusEmoji} <@${app.botUser}>: ${currentStatus?.toUpperCase()} for *${
            duration === Infinity
              ? "all time"
              : prettyms(duration, {
                  unitCount: 2,
                })
          }*, average *${avg.toFixed(2)}%*`;
        }

        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Edit",
              emoji: true,
            },
            value: app.id,
            action_id: "editApp",
          },
        };
      }),
    ],
  };
}
