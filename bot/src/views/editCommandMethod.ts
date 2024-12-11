import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";

export async function editCommandMethod(slackApp: Slack.App) {
  slackApp.view(
    "editCommandMethod",
    async ({ ack, view, client, body, respond }) => {
      if (body.type === "view_closed") {
        await ack();
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
          text: `Unfortunately, Slackus was unable to edit your app, as the command \`${command}\` does not exist on <@${botRes.bot?.user_id}>.`,
        });
        return;
      }

      await prisma.commandMethod.upsert({
        where: {
          methodId: app.method!.id,
        },
        update: {
          command,
        },
        create: {
          command,
          methodId: app.method!.id,
        },
      });

      await client.chat.postMessage({
        channel: body.user.id,
        text: `Slackus app <@${botRes.bot?.user_id}> has been edited!`,
      });
    },
  );
}
