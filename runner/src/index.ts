import 'dotenv/config';
import puppeteer from "puppeteer";
import Express from "express";

const app = Express()
const browser = await puppeteer.launch();

console.log("logging in to slack")
const SLACK_BASE_URL = `https://${process.env.SLACK_ORG}.slack.com`;
const loginPage = await browser.newPage();
await loginPage.goto(`${SLACK_BASE_URL}/sign_in_with_password`, { waitUntil: 'domcontentloaded' });
await loginPage.type('#email', process.env.SLACK_EMAIL!);
await loginPage.type('#password', process.env.SLACK_PASSWORD!);
await Promise.all([
  loginPage.waitForNavigation(),
  loginPage.click("#signin_btn"),
  loginPage.waitForNavigation(),
]);
console.log("logged in to slack")

const runnerPage = await browser.newPage()
await loginPage.close()

app.get("/commands", async (req, res) => {
  await runnerPage.goto(`${SLACK_BASE_URL}/marketplace/${req.query.appId}`);
  await runnerPage.waitForNavigation();
  await runnerPage.goto(`${runnerPage.url}?tab=features`, { waitUntil: 'networkidle0'});
  
  await runnerPage.$$eval(".p-app_directory_detail_features__command", commandElements => {
    let commands: string[] = [];

    for (const commandElement of commandElements) {
      commands.push(commandElement.innerHTML.split(" ")[0]);
    }

    res.json(commands);
  });  
})

app.listen(process.env.PORT ?? 3000);
