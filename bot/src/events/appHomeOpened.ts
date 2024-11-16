import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";

import dashboard from "../blocks/dashboard.js";

export async function appHomeOpened(app: Slack.App) {
  app.event("app_home_opened", async ({ event, client }) => {
    const user = event.user;

    const userApps = await prisma.app.findMany({
      where: {
        user,
      },
      include: {
        checks: true,
      },
    });

    const newApps = [];
    for (const app of userApps) {
      const botRes = await client.bots.info({
        bot: app.bot,
      });

      newApps.push({
        ...app,
        botUser: botRes!.bot!.user_id!,
      });
    }

    await client.views.publish({
      user_id: user,
      view: dashboard(newApps),
    });
  });
}
