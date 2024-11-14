import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";

export async function newCommandMethod(slackApp: Slack.App) {
  slackApp.view(
    "newCommandMethod",
    async ({ ack, view, client, body, respond }) => {
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

      if (!app) return;

      const botId = app.bot;
      const botRes = await client.bots.info({
        bot: botId,
      });
      const appId = botRes.bot?.app_id;
      const botCommands = await fetch(
        `${process.env.RUNNER_URL}/commands?appId=${appId}`,
      ).then((r) => r.json());

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
        text: `Slackus bot <@${botRes.bot?.user_id}> has been created!`,
      });
    },
  );
}
