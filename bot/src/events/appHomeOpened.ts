import Slack from "@slack/bolt";

import { updateDashboard } from "../util/updateDashboard.js";

export async function appHomeOpened(app: Slack.App) {
  app.event("app_home_opened", async ({ event, client }) => {
    const user = event.user;

    await updateDashboard(app, user);
  });
}
