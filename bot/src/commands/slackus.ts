import Slack from "@slack/bolt";

import newApp from "../blocks/newApp.js";
import { prisma } from "../util/prisma.js";
import { calculateUptime } from "../util/uptime.js";

export async function slackus(app: Slack.App) {
  app.command("/slackus", async ({ ack, client, body, respond, command }) => {
    await ack();

    const args = command.text.split(" ");

    if (args.length === 1) {
      const idMatch = args[1].match(/(?<=@)[A-Z\d]+/g) ?? [];
      const id = idMatch[0];

      if (!id) {
        return respond("Invalid user");
      }

      const botUserRes = await client.users.info({
        user: id ?? "",
      });

      if (!botUserRes.ok || !botUserRes?.user?.is_bot) {
        return respond("Invalid bot user");
      }

      const botId = botUserRes.user?.profile?.bot_id!;

      const app = await prisma.app.findFirst({
        where: {
          bot: botId,
        },
        include: {
          checks: true,
        },
      });

      if (!app) {
        return respond("This bot is not tracked by Slackus.");
      }

      const uptime = calculateUptime(app);

      await respond(
        `<@${id}> has been ${uptime}. Contact <@${app.user}> if you are having issues.`,
      );
    } else {
      const userDm = await client.conversations.open({
        users: body.user_id,
      });

      await client.views.open({
        trigger_id: body.trigger_id,
        view: newApp(userDm.channel!.id!),
      });
    }
  });
}
