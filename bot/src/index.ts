import "dotenv/config";
import Slack from "@slack/bolt";

import { prisma } from "./util/prisma.js";

import * as views from "./views/index.js";
import * as commands from "./commands/index.js";
import * as events from "./events/index.js";

const receiver = new Slack.ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const slackApp = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
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

async function runChecks() {
  const apps = await prisma.app.findMany({
    include: {
      checks: true,
      method: true,
    },
  });

  const appsToCheck: typeof apps = [];
  for (const app of apps) {
    if (
      new Date().valueOf() - app.interval * 60 * 1000 >=
      (app.checks.at(-1)?.timestamp?.valueOf() ?? 0)
    ) {
      appsToCheck.push(app);
    }
  }

  console.log(`Running ${appsToCheck.length} check(s)...`);

  for (const app of appsToCheck) {
    let runnerLocked = false;
    do {
      console.log("Checking for runner lock...");
      try {
        runnerLocked = await fetch(`${process.env.RUNNER_URL}/locked`).then(
          (r) => r.json(),
        );
      } catch {
        console.error("Runner lock check errored, assuming locked...");
        runnerLocked = true;
      }

      if (runnerLocked) {
        await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
      }
    } while (runnerLocked);

    console.log(`Runner unlocked, checking app ${app.id}`);

    if (!app.method) {
      console.error(`No method found for app ${app.id}`);
      continue;
    }

    const botRes = await slackApp.client.bots.info({
      bot: app.bot,
    });

    let failed = true;
    switch (app.method.type) {
      case "Command": {
        const commandMethod = await prisma.commandMethod.findUnique({
          where: {
            methodId: app.method.id,
          },
        });

        if (!commandMethod) {
          console.error(`No command method found for app ${app.id}`);
          continue;
        }

        const icon = botRes!
          .bot!.icons!.image_48!.toString()
          .replace("_48.png", "_32.png");

        failed = await fetch(
          `${process.env.RUNNER_URL}/check?command=${encodeURIComponent(commandMethod.command)}&pfp=${encodeURIComponent(icon)}`,
        ).then((r) => r.json());

        break;
      }

      case "HTTP": {
        const httpMethod = await prisma.httpMethod.findUnique({
          where: {
            methodId: app.method.id,
          },
        });

        if (!httpMethod) {
          console.error(`No HTTP method found for app ${app.id}`);
          continue;
        }

        try {
          const res = await fetch(httpMethod.url, {
            method: httpMethod.httpMethod,
          });

          console.log(res.status);

          // 2xx status codes == success
          if (res.status >= 200 && res.status < 300) {
            failed = false;
          } else {
            failed = true;
          }
        } catch (e) {
          failed = true;
        }

        break;
      }

      case "Heartbeat": {
        // If it's been <interval> since the last check, then there's been no heartbeats
        failed = true;

        break;
      }
    }

    const firstCheck = app.checks.length === 0;

    if ((app.checks.at(-1)?.status === "up" || firstCheck) && failed) {
      const conversations = app.conversations.split(",");

      for (const conversation of conversations) {
        await slackApp.client.chat.postMessage({
          channel: conversation,
          text: `Bot <@${botRes.bot?.user_id}> is down!`,
        });
      }
    }

    if ((app.checks.at(-1)?.status === "down" || firstCheck) && !failed) {
      const conversations = app.conversations.split(",");

      for (const conversation of conversations) {
        await slackApp.client.chat.postMessage({
          channel: conversation,
          text: `Bot <@${botRes.bot?.user_id}> is up!`,
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
  await slackApp.start(process.env.PORT ?? 4000);
  console.log("Slackus is up!");
})();
