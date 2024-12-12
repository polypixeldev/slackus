import Slack from "@slack/bolt";
import URL from "url";
import log from "loglevel";

import { prisma } from "../util/prisma.js";

export async function newHttpMethod(slackApp: Slack.App) {
  slackApp.view(
    "newHttpMethod",
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
        await ack();
        return;
      }

      const botId = app.bot;
      const botRes = await client.bots.info({
        bot: botId,
      });

      const url = view.state.values.url_input.url_input_action.value;
      const httpMethod =
        view.state.values.method_select.method_select_action.selected_option
          ?.value;

      if (url) {
        try {
          new URL.URL(url);
        } catch {
          await ack({
            response_action: "errors",
            errors: {
              url_input: "Invalid URL",
            },
          });
          return;
        }
      } else {
        await ack({
          response_action: "errors",
          errors: {
            url_input: "Invalid URL",
          },
        });
        return;
      }

      if (!httpMethod) {
        await ack({
          response_action: "errors",
          errors: {
            method_input: "Invalid method",
          },
        });
        return;
      }

      await ack({
        response_action: "clear",
      });

      await prisma.httpMethod.create({
        data: {
          url,
          httpMethod,
          methodId: app.method!.id,
        },
      });

      await client.chat.postMessage({
        channel: body.user.id,
        text: `Slackus app <@${botRes.bot?.user_id}> has been created!`,
      });
    },
  );
}
