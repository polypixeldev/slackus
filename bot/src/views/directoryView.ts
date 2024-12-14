import Slack from "@slack/bolt";

import { openDirectories } from "../util/directory.js";

export async function directoryView(slackApp: Slack.App) {
  slackApp.view(
    "directoryView",
    async ({ ack, view, client, body, payload }) => {
      await ack();

      if (body.type == "view_closed") {
        openDirectories.delete(body.user.id);
      }
    },
  );
}
