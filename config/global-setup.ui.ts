// global-setup.ts
import { Browser, chromium, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

async function globalSetup(config: FullConfig) {
    // const browser = await chromium.launch({headless: false})
    // await saveStorage(browser, process.env.SAUCEDEMO_USERNAME!!, process.env.SAUCEDEMO_PASSWORD!!, 'storage/standard.json')
    // await browser.close()
}

async function saveStorage(browser: Browser, userName: string, password: string, saveStoragePath: string) {
    // const page = await browser.newPage()
    // await page.goto(process.env.BASE_URL!!)
    // await page.fill(`#user-name`, userName)
    // await page.fill(`#password`, password)
    // await page.click(`#login-button`)
    // await page.waitForURL('**/inventory.html', {waitUntil: 'networkidle'});
    // await page.waitForTimeout(5000)
    // await page.context().storageState({ path: saveStoragePath })
}

export default globalSetup