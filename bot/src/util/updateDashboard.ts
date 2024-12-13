import Slack from "@slack/bolt";

import { prisma } from "./prisma.js";
import dashboard from "../blocks/dashboard.js";

export async function updateDashboard(slackApp: Slack.App, user: string) {
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
    const botRes = await slackApp.client.bots.info({
      bot: app.bot,
    });

    newApps.push({
      ...app,
      botUser: botRes!.bot!.user_id!,
    });
  }

  await slackApp.client.views.publish({
    user_id: user,
    view: dashboard(newApps),
  });
}
