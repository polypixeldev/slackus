import Slack from "@slack/bolt";

import { openDirectory } from "../util/directory.js";

export async function directory(app: Slack.App) {
  app.command("/directory", async ({ ack, client, body }) => {
    await ack();

    await openDirectory(app, body.user_id, body.trigger_id);
  });
}
