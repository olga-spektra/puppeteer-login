const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

const CREDENTIALS = require('./constants');

process.on('unhandledRejection', (error) => {
  throw error;
});

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.setViewport({ width: 1366, height: 768 });

  const url = 'http://rnp2-default.apps.ocp4one.namategroup.com/web/guest/home';

  await page.goto(url, { waitUntil: 'networkidle0' });

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

  await page.click('a.collapse-icon:nth-child(13)');

  await page.click(
    '#_com_liferay_product_navigation_product_menu_web_portlet_ProductMenuPortlet_portlet_com_liferay_exportimport_web_portlet_ExportPortlet',
  );

  await page.click('a.btn.btn-primary.nav-btn.nav-btn-monospaced');

  const [exportButton] = await page.$x("//button[contains(., 'Export')]");

  await exportButton.click();

  await page.waitForNavigation();

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

  await page.screenshot({ path: 'screenshot.png' });

  const downloadLink = await page.evaluate(() => {
    return document
      .querySelector('ul.list-group')
      .querySelector(
        'a[id^="_com_liferay_exportimport_web_portlet_ExportPortlet_"]',
      ).href;
  });

  console.log(downloadLink);

  const { data } = await axios.get(downloadLink, {
    headers: {
      Cookie: (await page.cookies())
        .map((cookie) => `${cookie.name}=${cookie.value};`)
        .join(' '),
    },
  });

  fs.writeFileSync('exported_file', data);

  process.exit(0);
})();
