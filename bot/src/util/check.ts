import { prisma } from "./prisma.js";
import log from "loglevel";

import type { App as SlackApp } from "@slack/bolt";
import type { App, Check, Method } from "@prisma/client";

export async function runChecks(slackApp: SlackApp) {
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

  log.info(`Running ${appsToCheck.length} check(s)...`);

  let successCount = 0;
  let failedCount = 0;
  for (const app of appsToCheck) {
    const failed = await checkApp(slackApp, app);

    if (failed == true) {
      failedCount++;
    } else if (failed == false) {
      successCount++;
    }
  }
  const totalCount = successCount + failedCount;

  log.info(
    `Successfully ran ${totalCount}/${appsToCheck.length} check(s) (${successCount} success, ${failedCount} fail, ${appsToCheck.length - totalCount} error)`,
  );
}

export async function checkApp(
  slackApp: SlackApp,
  app: App & { checks: Check[]; method: Method | null },
) {
  if (!app.method) {
    log.error(`No method found for app ${app.id}`);
    return;
  }

  if (app.method.type == "Command") {
    let runnerLocked = false;
    do {
      log.debug("Checking for runner lock...");
      try {
        runnerLocked = await fetch(`${process.env.RUNNER_URL}/locked`).then(
          (r) => r.json(),
        );
      } catch {
        log.error("Runner lock check errored, assuming locked...");
        runnerLocked = true;
      }

      if (runnerLocked) {
        await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
      }
    } while (runnerLocked);

    log.debug(`Runner unlocked, checking app ${app.id}`);
  }

  log.debug(`Checking app ${app.id}`);

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
        log.error(`No command method found for app ${app.id}`);
        return;
      }

      failed = await fetch(
        `${process.env.RUNNER_URL}/check?command=${encodeURIComponent(commandMethod.command)}`,
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
        log.error(`No HTTP method found for app ${app.id}`);
        return;
      }

      try {
        const res = await fetch(httpMethod.url, {
          method: httpMethod.httpMethod,
        });

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
        text: `App <@${botRes.bot?.user_id}> is down!`,
      });
    }
  }

  if ((app.checks.at(-1)?.status === "down" || firstCheck) && !failed) {
    const conversations = app.conversations.split(",");

    for (const conversation of conversations) {
      await slackApp.client.chat.postMessage({
        channel: conversation,
        text: `App <@${botRes.bot?.user_id}> is up!`,
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

  return failed;
}