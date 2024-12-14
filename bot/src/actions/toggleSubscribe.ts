import Slack from "@slack/bolt";
import log from "loglevel";

import { prisma } from "../util/prisma.js";
import { openDirectories, openDirectory } from "../util/directory.js";
import directoryView from "../blocks/directory.js";

export async function toggleSubscribe(slackApp: Slack.App) {
  slackApp.action("toggleSubscribe", async ({ ack, client, body, action }) => {
    await ack();

    if (body.type !== "block_actions" || !("value" in action)) return;
    const { appId, pageNum } = JSON.parse(action.value!);

    const app = await prisma.app.findUnique({
      where: {
        id: appId,
      },
    });

    if (!app) {
      log.error(`Tried to subscribe to nonexistent app ${appId}`);
      return;
    }

    const subscribers = app.subscribers.split(",");
    if (subscribers.includes(body.user.id)) {
      subscribers.splice(subscribers.indexOf(body.user.id), 1);
    } else {
      subscribers.push(body.user.id);
    }

    await prisma.app.update({
      where: {
        id: appId,
      },
      data: {
        subscribers: subscribers.join(","),
      },
    });

    if (openDirectories.has(body.user.id)) {
      const apps = await prisma.app.findMany({
        where: {
          NOT: {
            user: body.user.id,
          },
        },
        include: {
          checks: true,
        },
        orderBy: {
          id: "asc",
        },
        take: 4,
        skip: pageNum * 4,
      });

      const botUserPromises = [];
      for (const app of apps) {
        botUserPromises.push(
          client.bots
            .info({
              bot: app.bot,
            })
            .then((r) => r.bot?.user_id ?? app.bot),
        );
      }
      const botUsers = await Promise.all(botUserPromises);

      await client.views.update({
        trigger_id: body.trigger_id,
        view_id: openDirectories.get(body.user.id),
        view: directoryView(apps, botUsers, pageNum, body.user.id),
      });
    }
  });
}
