import 'dotenv/config';
import puppeteer from "puppeteer";
import Express from "express";
import readline from "readline/promises";

const app = Express();

(async () => {
  const browser = await puppeteer.launch();

  console.log("logging in to slack")
  const SLACK_BASE_URL = `https://${process.env.SLACK_ORG}.slack.com`;
  const loginPage = await browser.newPage();
  await loginPage.goto(`${SLACK_BASE_URL}/sign_in_with_password`, { waitUntil: 'networkidle2' });
  await loginPage.type('#email', process.env.SLACK_EMAIL!);
  await loginPage.type('#password', process.env.SLACK_PASSWORD!);
  await loginPage.click("#signin_btn");
  await loginPage.waitForNavigation({ waitUntil: 'load', timeout: 60000 });

  const inputsExist = await loginPage.evaluate(() => {
    return new Promise(resolve => {
      let intervalCount = 0;
      const interval = setInterval(() => {
        const inputs = document.querySelectorAll('input[inputmode="numeric"]');
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
      output: process.stdout
    });

    const code = await rl.question('Please enter the 6-digit 2FA code: ');
    rl.close();

    const codeArray = code.split('');

    const inputs = await loginPage.$$('input[inputmode="numeric"]');

    for (let i = 0; i < 6; i++) {
      await inputs[i].type(codeArray[i]);
    }

    await loginPage.keyboard.press('Enter');
    await loginPage.waitForNavigation();
  }

  console.log("logged in to slack")
  const loginCookies = await loginPage.cookies();
  
  const runnerPage = await browser.newPage()
  await runnerPage.setCookie(...loginCookies);
  await loginPage.close()
  
  app.get("/commands", async (req, res) => {
    await runnerPage.goto(`${SLACK_BASE_URL}/marketplace/${req.query.appId}`, { waitUntil: 'networkidle0', });
    console.log(runnerPage.url());
    await runnerPage.goto(`${runnerPage.url()}?tab=features`, { waitUntil: 'networkidle0'});
    
    const cmds = await runnerPage.$$eval(".p-app_directory_detail_features__command", commandElements => {
      let commands: string[] = [];
  
      for (const commandElement of commandElements) {
        const command = commandElement.innerHTML.split(" ")[0];
        if (command === "/") continue;
        commands.push(command);
      }
  
      return commands;
    });

    res.json(cmds);
  })
  
  app.listen(process.env.PORT ?? 3000);
})();