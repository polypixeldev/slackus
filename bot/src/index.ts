import "dotenv/config";
import Slack from "@slack/bolt";

import { prisma } from "./util/prisma.js";
import { runChecks } from "./util/check.js";

import * as actions from "./actions/index.js";
import * as commands from "./commands/index.js";
import * as events from "./events/index.js";
import * as views from "./views/index.js";

const receiver = new Slack.ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const slackApp = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

for (const [name, action] of Object.entries(actions)) {
  action(slackApp);
  console.log(`Registered action: ${name}`);
}

for (const [name, command] of Object.entries(commands)) {
  command(slackApp);
  console.log(`Registered command: ${name}`);
}

for (const [name, event] of Object.entries(events)) {
  event(slackApp);
  console.log(`Registered event: ${name}`);
}

for (const [name, view] of Object.entries(views)) {
  view(slackApp);
  console.log(`Registered view: ${name}`);
}

receiver.router.get("/heartbeat", async (req, res) => {
  const appId = req.query.app?.toString();

  if (!appId) {
    res.sendStatus(400);
    return;
  }

  const app = await prisma.app.findUnique({
    where: {
      id: appId,
    },
  });

  if (!app) {
    res.sendStatus(400);
    return;
  }

  await prisma.check.create({
    data: {
      appId,
      status: "up",
      timestamp: new Date(),
    },
  });

  res.sendStatus(200);
});

setInterval(
  () => {
    runChecks(slackApp);
  },
  5 * 60 * 1000,
);

runChecks(slackApp);

(async () => {
  await slackApp.start(process.env.PORT ?? 4000);
  console.log("Slackus is up!");
})();
