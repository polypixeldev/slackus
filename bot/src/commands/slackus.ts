import Slack from "@slack/bolt";

import newApp from "../blocks/newBot";

export async function slackus(app: Slack.App) {
  app.command("/slackus", async ({ ack, client, body }) => {
    await ack();

    await client.views.open({
      trigger_id: body.trigger_id,
      view: newApp(body.user_id),
    });
  });
}
