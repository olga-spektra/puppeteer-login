const puppeteer = require('puppeteer');
const CREDENTIALS = require('./constants');
const USERNAME = '#login_selector';
const PASSWORD = '#password_selector';
const LOGIN_BUTTON = '#login_button_selector';
const EXPORT_BUTTON = '#download_button_selector';
const IMPORT_BUTTON = '#import_button_selector';

async function startBrowser() {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  
  return {browser, page};
}

async function login_and_export(url) {
  const {browser, page} = await startBrowser();
  
  page.setViewport({width: 1366, height: 768});
  
  // Open the URL.
  await page.goto(url);

  // Logging in to instance 1.
  await page.waitForSelector(USERNAME);
  await page.keyboard.type(CREDENTIALS.username);
  await page.waitForSelector(PASSWORD);
  await page.keyboard.type(CREDENTIALS.password);
  await page.click(LOGIN_BUTTON);
      
      console.log('Logged in to instance 1.');

  // Setting the path and doing export.
  const path = require('path');
  const downloadPath = path.resolve('/PATH_TO_FILE');
  
  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });
  await Promise.all([
    page.waitForNavigation({
      waitUntil: 'networkidle0',
    }),
    page.waitForSelector(EXPORT_BUTTON),
    page.click(EXPORT_BUTTON),
  ]);
      console.log('Done.');
}

(async () => {
  await login_and_export("URL");
})()

///////////////////////////////////////////////////////////

async function login_and_import(url) {
  const {browser, page} = await startBrowser();
  
  page.setViewport({width: 1366, height: 768});
  
  // Open the URL.
  await page.goto(url);

  // Logging in to instance 2.
  await page.waitForSelector(USERNAME);
  await page.keyboard.type(CREDENTIALS.username);
  await page.waitForSelector(PASSWORD);
  await page.keyboard.type(CREDENTIALS.password);
  await page.click(LOGIN_BUTTON);
      
      console.log('Logged in to instance 2.');

  // Setting the file location and doing import.
  await page.waitForSelector('input[type=file]');
  await page.waitFor(5000);

  const elementHandle = await page.$("input[type=file]");
  
  await elementHandle.uploadFile('FILE');
  await page.click(IMPORT_BUTTON);

      console.log('Done');
}

(async () => {
  await login_and_import("URL");
      process.exit(1);
})()







