import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import editAppView from "../blocks/editApp.js";

export async function editApp(slackApp: Slack.App) {
  slackApp.action("editApp", async ({ ack, client, body, action }) => {
    await ack();

    if (body.type !== "block_actions" || !("value" in action)) return;

    const appId = action.value!;

    const app = await prisma.app.findUnique({
      where: {
        id: appId,
      },
      include: {
        method: true,
      },
    });

    if (!app) return;

    const botRes = await client.bots.info({
      bot: app.bot,
    });

    const userRes = await client.users.info({
      user: botRes.bot?.user_id!,
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: editAppView(app, userRes.user?.name!),
    });
  });
}
