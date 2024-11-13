import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";

import dashboard from "../blocks/dashboard.js";

export async function app_home_opened(app: Slack.App) {
  app.event("app_home_opened", async ({ event, client }) => {
    const user = event.user;

    const userBots = await prisma.app.findMany({
      where: {
        user,
      },
      include: {
        checks: true,
      },
    });

    const newBots = [];
    for (const app of userBots) {
      const botRes = await client.bots.info({
        bot: app.bot,
      });

      newBots.push({
        ...app,
        botUser: botRes!.bot!.user_id!,
      });
    }

    await client.views.publish({
      user_id: user,
      view: dashboard(newBots),
    });
  });
}
