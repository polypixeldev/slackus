import { calculateUptime } from "../util/uptime.js";

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

          const uptime = calculateUptime(app);

          text = `${statusEmoji} <@${app.botUser}>: ${uptime}`;
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
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Want to explore others' Slackus apps?",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Explore Slackus directory",
            emoji: true,
          },
          action_id: "directory",
        },
      },
    ],
  };
}
