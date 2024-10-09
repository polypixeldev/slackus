import Slack from "@slack/bolt";

export async function newSlackus(app: Slack.App) {
  app.view("newSlackus", async ({ ack, view, client }) => {
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
  });
}
