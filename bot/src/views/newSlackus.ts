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

    const botCommands = await fetch(
      `${process.env.RUNNER_URL}/commands?appId=${botUserRes.user?.profile?.bot_id}`,
    ).then((r) => r.json());

    const command = view.state.values.command_input.command_input_action.value;
    if (!botCommands.includes(command)) {
      return ack({
        response_action: "errors",
        errors: {
          command_input: "That bot does not have that command",
        },
      });
    }
  });
}
