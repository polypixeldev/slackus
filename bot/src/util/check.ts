import { prisma } from "./prisma.js";
import log from "loglevel";
import child_process from "child_process";
import * as Sentry from "@sentry/node";

import { updateDashboard } from "./updateDashboard.js";

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
        runnerLocked = await fetch(`${process.env.RUNNER_URL}/locked`, {
          // @ts-expect-error
          headers: {
            Authorization: process.env.API_SECRET,
          },
        }).then((r) => r.json());
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
        {
          // @ts-expect-error
          headers: {
            Authorization: process.env.API_SECRET,
          },
        },
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
  const commit = child_process
    .execSync("git rev-parse HEAD")
    .toString()
    .trim()
    .slice(0, 7);
  const userNameRes = await slackApp.client.users.profile.get({
    user: app.user,
  });
  const userName = userNameRes?.profile?.display_name ?? app.user;

  const defaultAttachment = {
    bot_id: botRes.bot?.id,
    fields: [
      {
        title: "Method",
        value: app.method.type,
      },
      {
        title: "Maintainer",
        value: `<https://hackclub.slack.com/team/${app.user}|${userName}>`,
      },
    ],
    footer: `Slackus @ ${commit} | ${new Date().toLocaleString()}`,
  };
  const conversations = app.conversations.split(",");
  conversations.push(...app.subscribers.split(","));

  const messages: { [id: string]: any } = {};

  if ((app.checks.at(-1)?.status === "up" || firstCheck) && failed) {
    for (const conversation of conversations) {
      messages[conversation] = {
        ...defaultAttachment,
        title: `App <@${botRes.bot?.user_id}> is down!`,
        fallback: `App <@${botRes.bot?.user_id}> is down!`,
        color: "danger",
      };
    }

    updateDashboard(slackApp, app.user);
  } else if ((app.checks.at(-1)?.status === "down" || firstCheck) && !failed) {
    for (const conversation of conversations) {
      messages[conversation] = {
        ...defaultAttachment,
        title: `App <@${botRes.bot?.user_id}> is up!`,
        fallback: `App <@${botRes.bot?.user_id}> is up!`,
        color: "good",
      };
    }
  }

  if (Object.keys(messages).length > 0) {
    for (const conversation in messages) {
      slackApp.client.chat
        .postMessage({
          channel: conversation,
          attachments: [messages[conversation]],
        })
        .then((r) => {
          if (r.error) {
            slackApp.client.chat.postMessage({
              channel: app.user,
              text: `There was an error when sending a notification for <@${botRes.bot?.user_id}> to <#${conversation}>. Please make sure <@U07RPCNGR2L> has access to this conversation or contact <@U04G40QKAAD> if this persists.\n\`\`\`${r.error}\`\`\``,
            });
            Sentry.captureException(r.error);
          }
        })
        .catch((e) => {
          slackApp.client.chat.postMessage({
            channel: app.user,
            text: `There was an error when sending a notification for <@${botRes.bot?.user_id}> to <#${conversation}>. Please make sure <@U07RPCNGR2L> has access to this conversation or contact <@U04G40QKAAD> if this persists.\n\`\`\`${e}\`\`\``,
          });
          Sentry.captureException(e);
        });
    }

    updateDashboard(slackApp, app.user);
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
