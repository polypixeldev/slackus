import Slack from "@slack/bolt";

import { prisma } from "../util/prisma";

export async function newBot(app: Slack.App) {
  app.view("newBot", async ({ ack, view, client, body, respond }) => {
    const botUserId =
      view.state.values.bot_select.bot_select_action.selected_user;
    const botUserRes = await client.users.info({
      user: botUserId ?? "",
    });

    if (!botUserRes.ok || !botUserRes?.user?.is_bot) {
      return ack({
        response_action: "errors",
        errors: {
          bot_select: "Invalid bot user",
        },
      });
    }

    await ack();

    const botId = botUserRes.user?.profile?.bot_id!;
    const appRes = await client.bots.info({
      bot: botId,
    });
    const appId = appRes.bot?.app_id;
    const botCommands = await fetch(
      `${process.env.RUNNER_URL}/commands?appId=${appId}`,
    ).then((r) => r.json());

    const command = view.state.values.command_input.command_input_action.value;
    if (!command || !botCommands.includes(command?.split(" ")[0])) {
      await client.chat.postMessage({
        channel: body.user.id,
        text: `Unfortunately, Slackus was unable to process your bot, as the command \`${command}\` does not exist on <@${botUserId}>.`,
      });
      return;
    }

    await prisma.app.create({
      data: {
        user: body.user.id,
        bot: botId,
        command,
        interval: Number(
          view.state.values.interval_input.interval_input_action.value,
        ),
        conversations:
          view.state.values.notify_select.notify_select_action.selected_conversations?.join(
            ",",
          ) ?? body.user.id,
      },
    });

    await client.chat.postMessage({
      channel: body.user.id,
      text: `Slackus bot <@${botUserId}> has been created!`,
    });
  });
}
