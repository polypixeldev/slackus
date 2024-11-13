export default function newApp(dmId: string) {
  return {
    type: "modal" as const,
    callback_id: "newBot",
    title: {
      type: "plain_text" as const,
      text: "New Slackus Bot",
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
          text: "Enter in the details of your bot below to add it to Slackus.",
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
        block_id: "command_input",
        element: {
          type: "plain_text_input",
          action_id: "command_input_action",
          placeholder: {
            type: "plain_text",
            text: "Starts with /",
          },
        },
        label: {
          type: "plain_text",
          text: "Command to run",
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
