import type { HttpMethod } from "@prisma/client";

const statusToLabel = {
  "2xx": "Only 2xx",
  "< 400": "Anything < 400",
};

export default function editHttpMethod(appId: string, method?: HttpMethod) {
  return {
    type: "modal" as const,
    callback_id: "editHttpMethod",
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
        block_id: "url_input",
        element: {
          type: "plain_text_input",
          action_id: "url_input_action",
          placeholder: {
            type: "plain_text",
            text: "https://hackclub.app/statuscheck",
          },
          initial_value: method?.url,
        },
        label: {
          type: "plain_text",
          text: "URL to request",
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
            text: "Select an HTTP method",
            emoji: true,
          },
          options: ["GET", "HEAD", "POST", "TRACE"].map((m) => ({
            text: {
              type: "plain_text",
              text: m,
              emoji: true,
            },
            value: m,
          })),
          initial_option: !method
            ? undefined
            : {
                text: {
                  type: "plain_text",
                  text: method!.httpMethod,
                  emoji: true,
                },
                value: method!.httpMethod,
              },
          action_id: "method_select_action",
        },
        label: {
          type: "plain_text",
          text: "HTTP method",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "status_select",
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "HTTP status codes",
            emoji: true,
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: statusToLabel["2xx"],
                emoji: true,
              },
              value: "2xx",
            },
            {
              text: {
                type: "plain_text",
                text: statusToLabel["< 400"],
                emoji: true,
              },
              value: "< 400",
            },
          ],
          initial_option: {
            text: {
              type: "plain_text",
              text: statusToLabel[
                method!.httpStatus as keyof typeof statusToLabel
              ],
              emoji: true,
            },
            value: method!.httpStatus,
          },
          action_id: "status_select_action",
        },
        label: {
          type: "plain_text",
          text: "What status codes should be considered as UP?",
          emoji: true,
        },
      },
    ],
  };
}
