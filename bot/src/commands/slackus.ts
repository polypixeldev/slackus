import Slack from "@slack/bolt";

import newSlackus from "../blocks/newSlackus";

export async function slackus(app: Slack.App) {
  app.command("/slackus", async ({ ack, client, body }) => {
    await ack();

    await client.views.open({
      trigger_id: body.trigger_id,
      view: newSlackus(body.user_id),
    });
  });
}
