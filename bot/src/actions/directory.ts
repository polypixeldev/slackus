import Slack from "@slack/bolt";

import { openDirectory } from "../util/directory.js";

export async function directory(slackApp: Slack.App) {
  slackApp.action("directory", async ({ ack, client, body, action }) => {
    await ack();

    if (body.type !== "block_actions") return;

    await openDirectory(slackApp, body.user.id, body.trigger_id);
  });
}
