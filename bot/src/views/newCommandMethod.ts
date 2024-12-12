import Slack from "@slack/bolt";
import log from "loglevel";

import { prisma } from "../util/prisma.js";

export async function newCommandMethod(slackApp: Slack.App) {
  slackApp.view(
    "newCommandMethod",
    async ({ ack, view, client, body, respond }) => {
      if (body.type === "view_closed") {
        await ack();
        await prisma.app.delete({
          where: {
            id: view.private_metadata,
          },
        });
        return;
      }

      await ack({
        response_action: "clear",
      });

      const app = await prisma.app.findUnique({
        where: {
          id: view.private_metadata,
        },
        include: {
          method: true,
        },
      });

      if (!app) {
        log.error(`Tried to edit nonexistent app ${view.private_metadata}`);
        return;
      }

      const botId = app.bot;
      const botRes = await client.bots.info({
        bot: botId,
      });
      const appId = botRes.bot?.app_id;
      let botCommands;
      try {
        botCommands = await fetch(
          `${process.env.RUNNER_URL}/commands?appId=${appId}`,
        ).then((r) => r.json());
      } catch (e) {
        log.error(
          `Error when fetching commands for bot ${botId} (${botRes.bot?.name}): ${e}`,
        );
        return;
      }

      const command =
        view.state.values.command_input.command_input_action.value;
      if (!command || !botCommands.includes(command?.split(" ")[0])) {
        await client.chat.postMessage({
          channel: body.user.id,
          text: `Unfortunately, Slackus was unable to start monitoring your bot, as the command \`${command}\` does not exist on <@${botRes.bot?.user_id}>.`,
        });
        await prisma.method.delete({
          where: {
            appId: app.id,
          },
        });
        await prisma.app.delete({
          where: {
            id: app.id,
          },
        });
        return;
      }

      await prisma.commandMethod.create({
        data: {
          command,
          methodId: app.method!.id,
        },
      });

      await client.chat.postMessage({
        channel: body.user.id,
        text: `Slackus app <@${botRes.bot?.user_id}> has been created! See this app's home for details.`,
      });
    },
  );
}
