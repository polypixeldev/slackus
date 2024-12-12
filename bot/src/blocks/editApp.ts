import type { App, Method } from "@prisma/client";

const methodToText = {
  Command: "Slash Command",
  HTTP: "HTTP(S) Request",
  Heartbeat: "Heartbeats",
};

const intervalToText = {
  5: "5 minutes",
  10: "10 minutes",
  15: "15 minutes",
  30: "30 minutes",
  60: "1 hour",
  1440: "1 day",
};

export default function editApp(
  app: App & { method: Method | null },
  botName: string,
) {
  return {
    type: "modal" as const,
    callback_id: "editApp",
    private_metadata: app.id,
    title: {
      type: "plain_text" as const,
      text: "Edit Slackus App",
      emoji: true,
    },
    submit: {
      type: "plain_text" as const,
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text" as const,
      text: "Cancel",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Make changes to your Slackus app *${botName}* below, or choose an action:`,
        },
      },
      {
        type: "actions",
        block_id: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Check now",
            },
            action_id: "check",
            value: app.id,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Delete app",
            },
            action_id: "delete",
            style: "danger",
            confirm: {
              title: {
                type: "plain_text",
                text: `Delete Slackus app ${botName}?`,
              },
              text: {
                type: "plain_text",
                text: `This will remove ${botName} from your Slackus dashboard and delete all uptime data. This will not affect the Slack bot itself.`,
              },
              confirm: {
                type: "plain_text",
                text: `Delete app`,
              },
              deny: {
                type: "plain_text",
                text: `Cancel`,
              },
              style: "danger",
            },
            value: app.id,
          },
        ],
      },
      {
        type: "input",
        block_id: "method_select",
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select a status checking method",
            emoji: true,
          },
          options: Object.keys(methodToText).map((method) => ({
            text: {
              type: "plain_text",
              text: methodToText[method as keyof typeof methodToText],
              emoji: true,
            },
            value: method as string,
          })),
          initial_option: {
            text: {
              type: "plain_text",
              text: methodToText[app.method!.type],
              emoji: true,
            },
            value: app.method!.type,
          },
          action_id: "method_select_action",
        },
        label: {
          type: "plain_text",
          text: "Status check method",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "interval_select",
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select an interval",
            emoji: true,
          },
          options: Object.keys(intervalToText).map((interval) => ({
            text: {
              type: "plain_text",
              text: intervalToText[
                Number(interval) as keyof typeof intervalToText
              ],
              emoji: true,
            },
            value: interval.toString(),
          })),
          initial_option: {
            text: {
              type: "plain_text",
              text: intervalToText[
                Number(app.interval) as keyof typeof intervalToText
              ],
              emoji: true,
            },
            value: app.interval.toString(),
          },
          action_id: "interval_select_action",
        },
        label: {
          type: "plain_text",
          text: "Check interval",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "notify_select",
        element: {
          type: "multi_conversations_select",
          placeholder: {
            type: "plain_text",
            text: "Select an item",
            emoji: true,
          },
          initial_conversations: app.conversations.split(","),
          action_id: "notify_select_action",
        },
        label: {
          type: "plain_text",
          text: "Conversations to notify",
          emoji: true,
        },
      },
    ],
  };
}
