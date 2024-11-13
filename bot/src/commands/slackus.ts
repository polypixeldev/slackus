import Slack from "@slack/bolt";

import newApp from "../blocks/newBot.js";

export async function slackus(app: Slack.App) {
  app.command("/slackus", async ({ ack, client, body }) => {
    await ack();

    const userDm = await client.conversations.open({
      users: body.user_id,
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: newApp(userDm.channel!.id!),
    });
  });
}
