import type { CommandMethod } from "@prisma/client";

export default function editCommandMethod(
  appId: string,
  method?: CommandMethod,
) {
  return {
    type: "modal" as const,
    callback_id: "editCommandMethod",
    private_metadata: appId,
    notify_on_close: true,
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
          text: "Let's continue with editing your Slackus app!",
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
          initial_value: method?.command.toString(),
        },
        label: {
          type: "plain_text",
          text: "Command to run",
          emoji: true,
        },
      },
    ],
  };
}
