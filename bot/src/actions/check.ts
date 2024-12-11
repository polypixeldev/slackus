import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import { checkApp } from "../util/check.js";

export async function check(slackApp: Slack.App) {
  slackApp.action("check", async ({ ack, client, body, action }) => {
    await ack();

    if (body.type !== "block_actions" || !("value" in action)) return;

    const appId = action.value!;

    const app = await prisma.app.findUnique({
      where: {
        id: appId,
      },
      include: {
        checks: true,
        method: true,
      },
    });

    if (app) {
      await checkApp(slackApp, app);
    }
  });
}
