import Slack from "@slack/bolt";

import newApp from "../blocks/newApp.js";

export async function newBot(app: Slack.App) {
  app.action("newBot", async ({ ack, client, body }) => {
    await ack();

    if (body.type !== "block_actions") return;

    const userDm = await client.conversations.open({
      users: body.user?.id,
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: newApp(userDm.channel!.id!),
    });
  });
}
