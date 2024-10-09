import "dotenv/config";
import Slack from "@slack/bolt";
import { PrismaClient } from "@prisma/client";

import * as views from "./views/index";
import * as commands from "./commands/index";

const app = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // Comment in prod
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const prisma = new PrismaClient();

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

(async () => {
  // Comment in prod
  await app.start();
  // await app.start(process.env.PORT ?? 3000);
  console.log("Slackus is up!");
})();
