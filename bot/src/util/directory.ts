import { prisma } from "../util/prisma.js";
import directoryView from "../blocks/directory.js";

import type { App } from "@slack/bolt";

export const openDirectories = new Map<string, string>();

export async function openDirectory(
  slackApp: App,
  userId: string,
  triggerId: string,
) {
  const apps = await prisma.app.findMany({
    where: {
      NOT: {
        user: userId,
      },
    },
    include: {
      checks: true,
    },
    orderBy: {
      id: "asc",
    },
    take: 4,
  });

  const botUserPromises = [];
  for (const app of apps) {
    botUserPromises.push(
      slackApp.client.bots
        .info({
          bot: app.bot,
        })
        .then((r) => r.bot?.user_id ?? app.bot),
    );
  }
  const botUsers = await Promise.all(botUserPromises);

  const view = await slackApp.client.views.open({
    trigger_id: triggerId,
    view: directoryView(apps, botUsers, 0, userId),
  });

  if (view.view?.id) {
    openDirectories.set(userId, view.view?.id);
  }
}
