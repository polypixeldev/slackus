import Slack from "@slack/bolt";
import log from "loglevel";

import { prisma } from "../util/prisma.js";
import editCommandMethod from "../blocks/editCommandMethod.js";
import editHttpMethod from "../blocks/editHttpMethod.js";
import newHeartbeatMethod from "../blocks/newHeartbeatMethod.js";

import type { MethodType } from "@prisma/client";

export async function editApp(slackApp: Slack.App) {
  slackApp.view("editApp", async ({ ack, view, client, body, payload }) => {
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

    const oldApp = await prisma.app.findUnique({
      where: {
        id: view.private_metadata,
      },
      include: {
        method: true,
      },
    });

    const retryIntervalStr =
      view.state.values.retry_select.retry_select_action.selected_option
        ?.value ?? "none";

    const app = await prisma.app.update({
      where: {
        id: view.private_metadata,
      },
      data: {
        interval: Number(
          view.state.values.interval_select.interval_select_action
            .selected_option?.value ?? 5,
        ),
        retryInterval:
          retryIntervalStr === "none" ? null : Number(retryIntervalStr),
        conversations:
          view.state.values.notify_select.notify_select_action.selected_conversations?.join(
            ",",
          ) ?? body.user.id,
      },
    });

    const methodType = view.state.values.method_select.method_select_action
      .selected_option?.value as MethodType;
    const sameMethod = oldApp?.method?.type === methodType;

    if (sameMethod) {
      switch (methodType) {
        case "Command": {
          const commandMethod = await prisma.commandMethod.findUnique({
            where: {
              methodId: oldApp?.method?.id,
            },
          });

          if (!commandMethod) {
            log.error(`No command method found for app ${app.id}`);
            return;
          }

          await ack({
            response_action: "push",
            view: editCommandMethod(app.id, commandMethod),
          });

          break;
        }

        case "HTTP": {
          const httpMethod = await prisma.httpMethod.findUnique({
            where: {
              methodId: oldApp?.method?.id,
            },
          });

          if (!httpMethod) {
            log.error(`No HTTP method found for app ${app.id}`);
            return;
          }

          await ack({
            response_action: "push",
            view: editHttpMethod(app.id, httpMethod),
          });

          break;
        }

        case "Heartbeat": {
          await ack({
            response_action: "push",
            view: newHeartbeatMethod(app.id, app.interval),
          });

          break;
        }
      }
    } else {
      await prisma.method.update({
        where: {
          id: oldApp?.method?.id,
        },
        data: {
          type: methodType,
          appId: app.id,
        },
      });

      switch (oldApp?.method?.type) {
        case "Command": {
          await prisma.commandMethod.delete({
            where: {
              methodId: oldApp?.method?.id,
            },
          });
          break;
        }

        case "HTTP": {
          await prisma.httpMethod.delete({
            where: {
              methodId: oldApp?.method?.id,
            },
          });
          break;
        }
      }

      switch (methodType) {
        case "Command": {
          await ack({
            response_action: "push",
            view: editCommandMethod(app.id),
          });

          break;
        }

        case "HTTP": {
          await ack({
            response_action: "push",
            view: editHttpMethod(app.id),
          });

          break;
        }

        case "Heartbeat": {
          await ack({
            response_action: "push",
            view: newHeartbeatMethod(app.id, app.interval),
          });

          break;
        }
      }
    }
  });
}
