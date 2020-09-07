/**
 * Can get removed once a new version of playwright-runner was released.
 * Mirrored from: https://github.com/microsoft/playwright-runner/blob/f0b616752e81e20c2e84af328208e6d2ffc3cb70/packages/playwright-runner/src/index.ts
 */
//#region
import { fixtures as importedFixtures } from '@playwright/test-runner';
import { LaunchOptions, BrowserType, Browser, BrowserContext, Page, chromium, firefox, webkit, BrowserContextOptions, devices } from 'playwright';
 type TypeOnlyTestState = {
  context: BrowserContext;
  page: Page;
};

 type TypeOnlyWorkerState = {
  browserType: BrowserType<Browser>;
  browser: Browser;
  defaultBrowserOptions: LaunchOptions;
  defaultContextOptions: BrowserContextOptions;
  browserName: 'chromium' | 'firefox' | 'webkit';
  device: null | string | BrowserContextOptions
};

const fixtures = importedFixtures.extend<TypeOnlyWorkerState, TypeOnlyTestState>();

export const it = fixtures.it;
export const expect = fixtures.expect;

fixtures.registerWorkerFixture('browserType', async ({ browserName }, test) => {
  const browserType = ({ chromium, firefox, webkit })[browserName];
  await test(browserType);
});

fixtures.registerWorkerFixture('browserName', async ({ }, test) => {
  await test((process.env.BROWSER as any) || 'chromium');
});

fixtures.registerWorkerFixture('browser', async ({ browserType, defaultBrowserOptions }, test) => {
  const browser = await browserType.launch(defaultBrowserOptions);
  await test(browser);
  await browser.close();
});

fixtures.registerWorkerFixture('device', async ({ }, test) => {
  await test(null);
});

fixtures.registerWorkerFixture('defaultContextOptions', async ({ device }, test) => {
  let contextOptions: BrowserContextOptions = {};

  if (device && typeof device === 'string')
    contextOptions = devices[device];
  else if (device && typeof device === 'object')
    contextOptions = device;

  await test({
    ...contextOptions
  });
});

fixtures.registerWorkerFixture('defaultBrowserOptions', async ({ }, test) => {
  await test({
    handleSIGINT: false,
    ...(process.env.HEADFUL ? { headless: false } : {})
  });
});

fixtures.registerFixture('context', async ({ browser, defaultContextOptions }, test) => {
  const context = await browser.newContext(defaultContextOptions);
  await test(context);
  await context.close();
});

//#endregion

import { loadSettings, CONSTS, utils, attach } from '@testim/root-cause-core';

fixtures.registerFixture('page', async ({ context, parallelIndex }, runTest, info) => {
  const page = await context.newPage()
  const startTestParams = {
    runId: CONSTS.FALLBACK_RUN_ID,
    projectRoot: process.cwd(),
    fullName: info.test.title,
    description: info.test.title,
    fullSuitePath: info.test.file,
  };
  const userSettings = await loadSettings();
  const attachController = await attach({
    page,
    startTestParams,
    activeFeatures: userSettings.features,
  });
  await runTest(attachController.page);
  await attachController.endTest({
    success: info.result.status === "passed",
    error: info.result.error
  })
});

it('is a basic test with the page', async ({ page }) => {
  await page.goto('https://playwright.dev/', {
    waitUntil: "networkidle"
  });
  await page.innerText('.home-navigation')
  expect(await page.innerText('.home-navigation')).toBe('🎭 Playwright');
  throw new Error("foobar")
});