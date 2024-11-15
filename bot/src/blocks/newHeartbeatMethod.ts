export default function newHeartbeatMethod(appId: string, interval: number) {
  return {
    type: "modal" as const,
    title: {
      type: "plain_text" as const,
      text: "Slackus App Info",
      emoji: true,
    },
    close: {
      type: "plain_text" as const,
      text: "Got it",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Your new Slackus app has been created!",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `
            Here are your details for the heartbeats:
            - Send a HTTPS GET request to \`${process.env.HOST_URL}/heartbeat?app=${appId}\` at least every ${interval} minutes
            - Slackus will respond with 200 OK
            - If your app fails to send a heartbeat within the interval (and an indeterminate grace period), Slackus will mark your app as down and notify you
          `,
        },
      },
    ],
  };
}
