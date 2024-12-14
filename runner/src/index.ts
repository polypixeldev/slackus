import "dotenv/config";
import "./instrument";
import * as Sentry from "@sentry/node";
import puppeteer from "puppeteer";
import Express from "express";
import readline from "readline/promises";
import fs from "fs";
import log from "loglevel";
import prefixer from "loglevel-plugin-prefix";

prefixer.reg(log);
prefixer.apply(log);

const LOG_LEVEL = process.env.LOG_LEVEL ?? "INFO";
log.setDefaultLevel("INFO");
log.setLevel(LOG_LEVEL as log.LogLevelDesc);

const app = Express();
app.use((req, res, next) => {
  log.debug(`HTTP ${req.method} ${req.path}`);
  next();
});

(async () => {
  const SLACK_BASE_URL = `https://${process.env.SLACK_ORG}.slack.com`;
  const browser = await puppeteer.launch();

  let cookies;
  if (fs.existsSync(".cookies")) {
    log.debug("Logging into Slack using existing .cookies file");
    cookies = JSON.parse(fs.readFileSync(".cookies", { encoding: "utf8" }));
  } else {
    log.debug("Logging into Slack using browser");
    const loginPage = await browser.newPage();
    await loginPage.goto(`${SLACK_BASE_URL}/sign_in_with_password`, {
      waitUntil: "networkidle2",
    });
    await loginPage.type("#email", process.env.SLACK_EMAIL!);
    await loginPage.type("#password", process.env.SLACK_PASSWORD!);
    await loginPage.click("#signin_btn");
    await loginPage.waitForNavigation({ waitUntil: "load", timeout: 60000 });

    const inputsExist = await loginPage.evaluate(() => {
      return new Promise((resolve) => {
        let intervalCount = 0;
        const interval = setInterval(() => {
          const inputs = document.querySelectorAll(
            'input[inputmode="numeric"]',
          );
          if (inputs.length == 6) {
            clearInterval(interval);
            resolve(true);
          }
          intervalCount += 1;
          if (intervalCount >= 5) {
            clearInterval(interval);
            resolve(false);
          }
        }, 500);
      });
    });

    if (inputsExist) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const code = await rl.question("Please enter the 6-digit 2FA code: ");
      rl.close();

      const codeArray = code.split("");

      const inputs = await loginPage.$$('input[inputmode="numeric"]');

      for (let i = 0; i < 6; i++) {
        await inputs[i].type(codeArray[i]);
      }

      await loginPage.keyboard.press("Enter");
      await loginPage.waitForNavigation();
    }

    log.debug(
      "Slack browser login successful - cookies saved in .cookies file",
    );
    cookies = await loginPage.cookies();

    await fs.writeFileSync(".cookies", JSON.stringify(cookies));

    await loginPage.close();
  }
  log.info("Logged into Slack");

  app.use((req, res, next) => {
    if (req.headers.authorization !== process.env.API_SECRET) {
      res.sendStatus(403);
    } else {
      next();
    }
  });

  app.get("/commands", async (req, res) => {
    const runnerPage = await browser.newPage();
    await runnerPage.setCookie(...cookies);

    await runnerPage.goto(`${SLACK_BASE_URL}/marketplace/${req.query.appId}`, {
      waitUntil: "networkidle0",
    });
    await runnerPage.goto(`${runnerPage.url()}?tab=features`, {
      waitUntil: "networkidle0",
    });

    const cmds = await runnerPage.$$eval(
      ".p-app_directory_detail_features__command",
      (commandElements) => {
        let commands: string[] = [];

        for (const commandElement of commandElements) {
          const command = commandElement.innerHTML.split(" ")[0];
          if (command === "/") continue;
          commands.push(command);
        }

        return commands;
      },
    );

    res.json(cmds);
    await runnerPage.close();
  });

  let locked = false;

  app.get("/locked", async (req, res) => {
    res.json(locked);
  });

  app.get("/check", async (req, res, next) => {
    locked = true;
    const runnerPage = await browser.newPage();
    await runnerPage.setCookie(...cookies);
    await runnerPage.goto(
      `https://app.slack.com/client/${process.env.SLACK_TEAM}/${process.env.SLACK_CHANNEL}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));

    const command = req.query.command!.toString();
    await runnerPage.type(`.ql-editor`, command.split(" ")[0]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const commandChoices = await runnerPage.$$eval(
      ".tab_complete_ui_item",
      (commandElements) => commandElements.map((e) => e.id),
    );

    if (!commandChoices) {
      for (let i = 0; i < command.split(" ")[0].length; i++) {
        await runnerPage.keyboard.press("Backspace");
      }

      res.json(true);
      await runnerPage.close();
      next();
      return;
    }

    await runnerPage.click(`#${commandChoices[0]}`);
    await runnerPage.type(`.ql-editor`, command.split(" ").slice(1).join(" "));
    await runnerPage.keyboard.press("Enter");

    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));

    const failed = await runnerPage.$$eval(
      ".c-message_kit__text",
      (messages) => {
        const failRegex = /failed with the error ".+"/;
        for (const message of messages) {
          if (failRegex.test(message.innerHTML)) {
            const authorElement = message.parentElement
              ?.querySelector("span")
              ?.querySelector("span")
              ?.querySelector("button");
            if (authorElement?.dataset.messageSender === "USLACKBOT") {
              message.dispatchEvent(new CustomEvent("contextmenu"));
              const deleteButton = document.querySelector(
                ".c-menu_item__label",
              );
              deleteButton?.dispatchEvent(
                new MouseEvent("click", {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                }),
              );
              const confirmButton = document.querySelector(
                ".c-button--focus-visible",
              );
              confirmButton?.dispatchEvent(
                new MouseEvent("click", {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                }),
              );
              return true;
            }
          }
        }

        return false;
      },
    );

    res.json(failed);
    await runnerPage.close();
    next();
  });

  app.use((req, res, next) => {
    if (locked) {
      log.debug("Unlocking runner");
      locked = false;
    }
    next();
  });

  Sentry.setupExpressErrorHandler(app);

  // @ts-expect-error
  app.use((err, req, res, next) => {
    log.error(err);
    if (locked) {
      log.debug("Unlocking runner");
      locked = false;
    }
    next(err);
  });

  const port = process.env.PORT ?? 3000;
  app.listen(port);
  log.info(`Slackus runner is up (listening on port ${port})`);
})();
