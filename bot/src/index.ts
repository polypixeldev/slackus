import "dotenv/config";
import Slack from "@slack/bolt";
import log from "loglevel";
import prefixer from "loglevel-plugin-prefix";

import { prisma } from "./util/prisma.js";
import { runChecks } from "./util/check.js";

import * as actions from "./actions/index.js";
import * as commands from "./commands/index.js";
import * as events from "./events/index.js";
import * as views from "./views/index.js";

prefixer.reg(log);
prefixer.apply(log);

const LOG_LEVEL = process.env.LOG_LEVEL ?? "INFO";
log.setDefaultLevel("INFO");
log.setLevel(LOG_LEVEL as log.LogLevelDesc);

const receiver = new Slack.ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const SLACK_LOG_LEVEL =
  LOG_LEVEL in Slack.LogLevel
    ? Slack.LogLevel[LOG_LEVEL as keyof typeof Slack.LogLevel]
    : Slack.LogLevel.INFO;

const slackApp = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  logLevel: SLACK_LOG_LEVEL,
});

for (const [name, action] of Object.entries(actions)) {
  action(slackApp);
  log.debug(`Registered action: ${name}`);
}

for (const [name, command] of Object.entries(commands)) {
  command(slackApp);
  log.debug(`Registered command: ${name}`);
}

for (const [name, event] of Object.entries(events)) {
  event(slackApp);
  log.debug(`Registered event: ${name}`);
}

for (const [name, view] of Object.entries(views)) {
  view(slackApp);
  log.debug(`Registered view: ${name}`);
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
  const port = process.env.PORT ?? 4000;
  await slackApp.start(port);
  log.info(`Slackus is up! (Listening on port ${port})`);
})();
