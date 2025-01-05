const intervalToText = {
  5: "5 minutes",
  10: "10 minutes",
  15: "15 minutes",
  30: "30 minutes",
  60: "1 hour",
  1440: "1 day",
};

export default function newApp(dmId: string) {
  return {
    type: "modal" as const,
    callback_id: "newApp",
    title: {
      type: "plain_text" as const,
      text: "New Slackus App",
      emoji: true,
    },
    submit: {
      type: "plain_text" as const,
      text: "Next",
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
          text: "Enter in the details of your app below to add it to Slackus.",
        },
      },
      {
        type: "input",
        block_id: "bot_select",
        element: {
          type: "users_select",
          placeholder: {
            type: "plain_text",
            text: "Select a user",
            emoji: true,
          },
          action_id: "bot_select_action",
        },
        label: {
          type: "plain_text",
          text: "Bot user",
          emoji: true,
        },
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
          options: [
            {
              text: {
                type: "plain_text",
                text: "HTTP(S) Request",
                emoji: true,
              },
              value: "HTTP",
            },
            {
              text: {
                type: "plain_text",
                text: "Heartbeats",
                emoji: true,
              },
              value: "Heartbeat",
            },
            {
              text: {
                type: "plain_text",
                text: "Slash Command (not recommended)",
                emoji: true,
              },
              value: "Command",
            },
          ],
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
        block_id: "retry_select",
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select a delay",
            emoji: true,
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "Do not retry",
                emoji: true,
              },
              value: "none",
            },
            ...Object.keys(intervalToText).map((interval) => ({
              text: {
                type: "plain_text",
                text: intervalToText[
                  Number(interval) as keyof typeof intervalToText
                ],
                emoji: true,
              },
              value: interval.toString(),
            })),
          ],
          action_id: "retry_select_action",
        },
        label: {
          type: "plain_text",
          text: "Retry delay (Slackus will wait this long to retry in case of a false failure)",
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
          initial_conversations: ["C080E033Q0N", dmId],
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
