import "dotenv/config";
import Slack from "@slack/bolt";

import { prisma } from "./util/prisma.js";

import * as views from "./views/index.js";
import * as commands from "./commands/index.js";
import * as events from "./events/index.js";

const slackApp = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // Comment in prod
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

slackApp.command("/slackus", async ({ ack }) => {
  await ack();
});

for (const [name, view] of Object.entries(views)) {
  view(slackApp);
  console.log(`Registered view: ${name}`);
}

for (const [name, command] of Object.entries(commands)) {
  command(slackApp);
  console.log(`Registered command: ${name}`);
}

for (const [name, event] of Object.entries(events)) {
  event(slackApp);
  console.log(`Registered event: ${name}`);
}

async function runChecks() {
  const apps = await prisma.app.findMany({
    include: {
      checks: true,
    },
  });
  console.log(`Running ${apps.length} check(s)...`);

  const staleApps: typeof apps = [];
  for (const app of apps) {
    if (
      new Date().valueOf() - app.interval * 60 * 1000 >=
      (app.checks.at(-1)?.timestamp?.valueOf() ?? 0)
    ) {
      staleApps.push(app);
    }
  }

  for (const app of staleApps) {
    const botRes = await slackApp.client.bots.info({
      bot: app.bot,
    });
    const icon = botRes!
      .bot!.icons!.image_48!.toString()
      .replace("_48.png", "_32.png");

    const failed = await fetch(
      `${process.env.RUNNER_URL}/check?command=${encodeURIComponent(app.command)}&pfp=${encodeURIComponent(icon)}`,
    ).then((r) => r.json());

    if (app.checks.at(-1)?.status === "up" && failed) {
      const conversations = app.conversations.split(",");

      for (const conversation of conversations) {
        await slackApp.client.chat.postMessage({
          channel: conversation,
          text: `Bot <@${botRes.bot?.user_id}> is down!`,
        });
      }
    }

    if (app.checks.at(-1)?.status === "down" && !failed) {
      const conversations = app.conversations.split(",");

      for (const conversation of conversations) {
        await slackApp.client.chat.postMessage({
          channel: conversation,
          text: `Bot <@${botRes.bot?.user_id}> is back up!`,
        });
      }
    }

    await prisma.check.create({
      data: {
        timestamp: new Date(),
        appId: app.id,
        status: failed ? "down" : "up",
      },
    });
  }
}

setInterval(runChecks, 5 * 60 * 1000);

runChecks();

(async () => {
  // Comment in prod
  await slackApp.start();
  // await app.start(process.env.PORT ?? 3000);
  console.log("Slackus is up!");
})();
