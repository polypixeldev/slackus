export default function newSlackus(userId: string) {
  return {
    type: "modal" as const,
    callback_id: "newSlackus",
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
        block_id: "interval_input",
        element: {
          type: "number_input",
          is_decimal_allowed: false,
          action_id: "interval_input_action",
          initial_value: "5",
          min_value: "5",
        },
        label: {
          type: "plain_text",
          text: "Check interval (minutes)",
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
          initial_conversations: [userId],
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
