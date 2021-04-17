const puppeteer = require('puppeteer');
const C = require('./constants');
const USERNAME = '#username';
const PASSWORD = '#password';
const LOGIN_BUTTON = '#organic-div';
const DOWNLOAD_BUTTON = '#dashboard';
const EXPLORE_BUTTON = '#ember146';

async function startBrowser() {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  return {browser, page};
}

async function playTest(url) {
  const {browser, page} = await startBrowser();
  page.setViewport({width: 1366, height: 768});
  await page.goto(url);
  await page.waitForSelector(USERNAME);
  await page.keyboard.type(C.username);
  console.log('hui')
  await page.waitForSelector(PASSWORD);
  await page.keyboard.type(C.password);
  console.log('pizda');
  await page.click(LOGIN_BUTTON).then(() => page.waitForNavigation({ waitUntil: 'load' }));
  console.log('suka');
  await page.waitForSelector(EXPLORE_BUTTON);
  console.log('blja');
  await page.click(EXPLORE_BUTTON);
  console.log('loh');
//     const path = require('path');
//     const downloadPath = path.resolve('/home/qbsadmin');
//     await page._client.send('Page.setDownloadBehavior', {
//     behavior: 'allow',
//     downloadPath: downloadPath
// });
//     await page.click('#cta-navbar-freedownload-main-en-test');
}

(async () => {
  await playTest("https://linkedin.com/login");
  process.exit(1);
})();

// async function download(url) {
//   const {browser, page} = await startBrowser();
//   page.setViewport({width: 1366, height: 768});
//   await page.goto(url);
//   const path = require('path');
//   const downloadPath = path.resolve('/home/qbsadmin');
//   await page._client.send('Page.setDownloadBehavior', {
//     behavior: 'allow',
//     downloadPath: downloadPath
// });

//   await page.click('#cta-navbar-freedownload-main-en-test');
// }

// (async () => {
//   await download("https://blog.malwarebytes.com/cybercrime/2012/10/pick-a-download-any-download/");
// })()