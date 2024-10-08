import "dotenv/config";
import Slack from "@slack/bolt";
import { PrismaClient } from "@prisma/client";

const app = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // Comment in prod
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const prisma = new PrismaClient();

(async () => {
  // Comment in prod
  await app.start();
  // await app.start(process.env.PORT ?? 3000);
  console.log("Slackus is up!");
})();
