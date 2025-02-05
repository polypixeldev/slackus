export default function newHttpMethod(appId: string) {
  return {
    type: "modal" as const,
    callback_id: "newHttpMethod",
    private_metadata: appId,
    notify_on_close: true,
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
          text: "Let's continue with creating your new Slackus app!",
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
                text: "Only 2xx",
                emoji: true,
              },
              value: "2xx",
            },
            {
              text: {
                type: "plain_text",
                text: "Anything < 400",
                emoji: true,
              },
              value: "< 400",
            },
            {
              text: {
                type: "plain_text",
                text: statusToLabel["404"],
                emoji: true,
              },
              value: "404",
            },
          ],
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
