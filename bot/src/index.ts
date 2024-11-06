import "dotenv/config";
import { App as SlackApp } from "@slack/bolt";

import { prisma } from "./util/prisma";

import * as views from "./views/index";
import * as commands from "./commands/index";

import type { App } from "@prisma/client";

const app = new SlackApp({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // Comment in prod
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.command("/slackus", async ({ ack }) => {
  await ack();
});

for (const [name, view] of Object.entries(views)) {
  view(app);
  console.log(`Registered view: ${name}`);
}

for (const [name, view] of Object.entries(commands)) {
  view(app);
  console.log(`Registered command: ${name}`);
}

async function runChecks() {
  const checks = await prisma.app.findMany({});
  console.log(`Running ${checks.length} check(s)...`);

  const staleChecks: App[] = [];
  for (const check of checks) {
    if (
      new Date().valueOf() - check.interval * 60 * 1000 >=
      (check.lastCheck?.valueOf() ?? 0)
    ) {
      staleChecks.push(check);
    }
  }

  for (const check of staleChecks) {
    const botRes = await app.client.bots.info({
      bot: check.bot,
    });
    const icon = botRes!
      .bot!.icons!.image_48!.toString()
      .replace("_48.png", "_32.png");

    const failed = await fetch(
      `${process.env.RUNNER_URL}/check?command=${encodeURIComponent(check.command)}&pfp=${encodeURIComponent(icon)}`,
    ).then((r) => r.json());

    if (failed) {
      const conversations = check.conversations.split(",");

      for (const conversation of conversations) {
        await app.client.chat.postMessage({
          channel: conversation,
          text: `Check for bot <@${botRes.bot?.user_id}> failed!`,
        });
      }
    }

    // await prisma.app.update({
    //   where: {
    //     id: check.id,
    //   },
    //   data: {
    //     lastCheck: new Date(),
    //   },
    // });
  }
}

setInterval(runChecks, 5 * 60 * 1000);

runChecks();

(async () => {
  // Comment in prod
  await app.start();
  // await app.start(process.env.PORT ?? 3000);
  console.log("Slackus is up!");
})();
