import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import newCommandMethod from "../blocks/newCommandMethod.js";
import newHttpMethod from "../blocks/newHttpMethod.js";

import type { MethodType } from "@prisma/client";

export async function newApp(slackApp: Slack.App) {
  slackApp.view("newApp", async ({ ack, view, client, body, payload }) => {
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

    const botId = botUserRes.user?.profile?.bot_id!;

    const botExists =
      (await prisma.app.findFirst({
        where: {
          bot: botId,
        },
      })) !== null;

    if (botExists) {
      await ack({
        response_action: "errors",
        errors: {
          bot_select: "There is already a Slackus app with this bot",
        },
      });
      return;
    }

    const conversations = view.state.values.notify_select.notify_select_action
      .selected_conversations ?? [body.user.id];

    const privateConversations = [];
    for (const conversation of conversations) {
      try {
        const info = await client.conversations.info({
          channel: conversation,
        });

        if (!info.ok) {
          privateConversations.push(conversation);
        }
      } catch {
        privateConversations.push(conversation);
      }
    }

    if (privateConversations.length > 0) {
      await ack({
        response_action: "errors",
        errors: {
          notify_select:
            "Slackus does not have access to one or more of these conversations",
        },
      });
      return;
    }

    const app = await prisma.app.create({
      data: {
        user: body.user.id,
        bot: botId,
        interval: Number(
          view.state.values.interval_select.interval_select_action.value ?? 5,
        ),
        conversations:
          view.state.values.notify_select.notify_select_action.selected_conversations?.join(
            ",",
          ) ?? body.user.id,
      },
    });

    const methodType = view.state.values.method_select.method_select_action
      .selected_option?.value as MethodType;

    await prisma.method.create({
      data: {
        type: methodType,
        appId: app.id,
      },
    });

    switch (methodType) {
      case "Command": {
        await ack({
          response_action: "push",
          view: newCommandMethod(app.id),
        });

        break;
      }

      case "HTTP": {
        await ack({
          response_action: "push",
          view: newHttpMethod(app.id),
        });

        break;
      }
    }
  });
}
