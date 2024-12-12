import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";

export async function deleteApp(slackApp: Slack.App) {
  slackApp.action("delete", async ({ ack, client, body, action }) => {
    await ack();

    if (body.type !== "block_actions" || !("value" in action)) return;

    const appId = action.value!;

    await prisma.app.delete({
      where: {
        id: appId,
      },
    });
  });
}
