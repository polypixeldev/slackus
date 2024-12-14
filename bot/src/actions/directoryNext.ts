import Slack from "@slack/bolt";

import directoryView from "../blocks/directory.js";
import { prisma } from "../util/prisma.js";
import { openDirectories } from "../util/directory.js";

export async function directoryNext(slackApp: Slack.App) {
  slackApp.action("directoryNext", async ({ ack, client, body, action }) => {
    await ack();

    if (body.type !== "block_actions" || !("value" in action)) return;
    const pageNum = Number(action.value);

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
      skip: (pageNum + 1) * 4,
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
      view: directoryView(apps, botUsers, pageNum + 1, body.user.id),
    });
  });
}
