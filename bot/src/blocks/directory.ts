import { calculateUptime } from "../util/uptime.js";

import type { App, Check } from "@prisma/client";

export default function directory(
  apps: (App & { checks: Check[] })[],
  botUsers: string[],
  pageNum: number,
  userId: string,
) {
  return {
    type: "modal" as const,
    callback_id: "directoryView",
    notify_on_close: true,
    title: {
      type: "plain_text" as const,
      text: "Slackus Directory",
      emoji: true,
    },
    close: {
      type: "plain_text" as const,
      text: "Close",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Page ${pageNum + 1}*`,
        },
      },
      ...(apps.length == 0
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*We've got no more apps to show you here* :(\n _Be the first to add an app on page ${pageNum + 1}!_`,
              },
            },
          ]
        : apps.map((app, i) => ({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*<@${botUsers[i]}>*\n_Maintained by <@${app.user}>_\n_Uptime: ${calculateUptime(app)}_`,
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: app.subscribers.split(",").includes(userId)
                  ? "Unsubscribe"
                  : "Subscribe",
                emoji: true,
              },
              value: JSON.stringify({
                appId: app.id,
                pageNum: pageNum,
              }),
              action_id: "toggleSubscribe",
            },
          }))),
      {
        type: "actions",
        elements: [
          pageNum == 0
            ? null
            : {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Previous",
                  emoji: true,
                },
                value: pageNum.toString(),
                action_id: "directoryPrevious",
              },
          apps.length == 0
            ? null
            : {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Next",
                  emoji: true,
                },
                value: pageNum.toString(),
                action_id: "directoryNext",
              },
        ].filter((b) => b != null),
      },
    ],
  };
}
