const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CREDENTIALS = require('./constants');

process.on('unhandledRejection', (error) => {
  throw error;
});

if (!fs.existsSync('files')) {
  fs.mkdirSync('files');
}

async function createPage(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.setViewport({ width: 1366, height: 768 });

  await page.goto(url, { waitUntil: 'networkidle0' });

  return { page };
}

async function doLogin(page) {
  await page.click(
    '#_com_liferay_product_navigation_user_personal_bar_web_portlet_ProductNavigationUserPersonalBarPortlet_qfkd____',
  );

  console.log('button_clicked');

  await page.waitForSelector(
    '#_com_liferay_login_web_portlet_LoginPortlet_login',
    {
      visible: true,
    },
  );

  console.log('selector_visible');

  await page.type(
    '#_com_liferay_login_web_portlet_LoginPortlet_login',
    CREDENTIALS.username,
  );

  await page.type(
    '#_com_liferay_login_web_portlet_LoginPortlet_password',
    CREDENTIALS.password,
  );

  const [signInButton] = await page.$x("//button[contains(., 'Sign In')]");

  await signInButton.click();

  await page.waitForNavigation();

  console.log('were_in');
}

async function waitUntilLoadingIsDone(page) {
  while (true) {
    const elements = await page.$$('.list-group-header-title');

    let stillLoading = false;

    for (const element of elements) {
      const textContent = await (
        await element.getProperty('textContent')
      ).jsonValue();

      if (textContent.includes('Current')) {
        stillLoading = true;
      }
    }

    if (!stillLoading) {
      break;
    }
  }
}

async function doExport() {
  const url = 'http://rnp2-default.apps.ocp4one.namategroup.com/web/guest/home';

  const { page } = await createPage(url);

  await doLogin(page);

  await page.click('a.collapse-icon:nth-child(13)');

  await page.click(
    '#_com_liferay_product_navigation_product_menu_web_portlet_ProductMenuPortlet_portlet_com_liferay_exportimport_web_portlet_ExportPortlet',
  );

  await page.waitForSelector('a.btn.btn-primary.nav-btn.nav-btn-monospaced');

  await page.click('a.btn.btn-primary.nav-btn.nav-btn-monospaced');

  await page.waitForTimeout(1000);

  const [exportButton] = await page.$x("//button[contains(., 'Export')]");

  await exportButton.click();

  await page.waitForNavigation();

  await waitUntilLoadingIsDone(page);

  await page.screenshot({ path: 'screenshot.png' });

  const { id: downloadElementId, href: downloadLink } = await page.evaluate(
    () => {
      const { id, href } = document
        .querySelector('ul.list-group')
        .querySelector(
          'a[id^="_com_liferay_exportimport_web_portlet_ExportPortlet_"]',
        );

      return { id, href };
    },
  );

  console.log(downloadElementId, downloadLink);

  const {
    headers: { 'content-disposition': contentDisposition },
  } = await axios.head(downloadLink, {
    headers: {
      Cookie: (await page.cookies())
        .map((cookie) => `${cookie.name}=${cookie.value};`)
        .join(' '),
    },
    responseType: 'blob',
  });

  const filePath = `files/${contentDisposition
    .split(' ')[1]
    .split('=')[1]
    .replace(/"/gi, '')}`;

  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path.resolve('files'),
  });

  await page.click(`#${downloadElementId}`);

  await page.waitForTimeout(1000);

  console.log('file_saved');

  return path.resolve(filePath);
}

async function doImport(filePath) {
  const url = 'http://rnp2-default.apps.ocp4one.namategroup.com/web/guest/home';

  const { page } = await createPage(url);

  await doLogin(page);

  await page.click('a.collapse-icon:nth-child(13)');

  await page.click(
    '#_com_liferay_product_navigation_product_menu_web_portlet_ProductMenuPortlet_portlet_com_liferay_exportimport_web_portlet_ImportPortlet',
  );

  await page.waitForSelector('a.btn.btn-primary.nav-btn.nav-btn-monospaced');

  await page.click('a.btn.btn-primary.nav-btn.nav-btn-monospaced');

  await page.waitForTimeout(1000);

  const elementHandle = await page.$('input[type=file]');

  await elementHandle.uploadFile(filePath);

  await page.waitForTimeout(5000);

  await page.waitForSelector(
    '#_com_liferay_exportimport_web_portlet_ImportPortlet_continueButton',
  );

  await page.click(
    '#_com_liferay_exportimport_web_portlet_ImportPortlet_continueButton',
  );

  await page.waitForTimeout(5000);

  const [importButton] = await page.$x("//button[contains(., 'Import')]");

  await importButton.click();

  await page.waitForNavigation();

  await waitUntilLoadingIsDone(page);

  await page.screenshot({ path: 'screenshot.png' });
}

(async () => {
  const filePath = await doExport();

  await doImport(filePath);

  process.exit(0);
})();
