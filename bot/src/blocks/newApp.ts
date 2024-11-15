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
                text: "Slash Command",
                emoji: true,
              },
              value: "Command",
            },
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
          options: [
            {
              text: {
                type: "plain_text",
                text: "5 minutes",
                emoji: true,
              },
              value: "5",
            },
            {
              text: {
                type: "plain_text",
                text: "10 minutes",
                emoji: true,
              },
              value: "10",
            },
            {
              text: {
                type: "plain_text",
                text: "15 minutes",
                emoji: true,
              },
              value: "15",
            },
            {
              text: {
                type: "plain_text",
                text: "30 minutes",
                emoji: true,
              },
              value: "30",
            },
            {
              text: {
                type: "plain_text",
                text: "1 hour",
                emoji: true,
              },
              value: "60",
            },
            {
              text: {
                type: "plain_text",
                text: "1 day",
                emoji: true,
              },
              value: "1440",
            },
          ],
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
