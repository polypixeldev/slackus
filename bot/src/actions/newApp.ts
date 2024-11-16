import Slack from "@slack/bolt";

import newAppView from "../blocks/newApp.js";

export async function newApp(app: Slack.App) {
  app.action("newApp", async ({ ack, client, body }) => {
    await ack();

    if (body.type !== "block_actions") return;

    const userDm = await client.conversations.open({
      users: body.user?.id,
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: newAppView(userDm.channel!.id!),
    });
  });
}
