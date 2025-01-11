import { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
    readonly page: Page
    readonly usernameInput: Locator
    readonly passwordInput: Locator
    readonly loginButton: Locator

    constructor (page: Page) {
      super()
      this.page = page
      this.usernameInput = page.locator('#user-name')
      this.passwordInput = page.locator('#password')
      this.loginButton = page.locator("#login-button")
    }
  
  
    async navigateToSauceDashboard() {
      await this.page.goto(process.env.BASE_URL!!)
      await this.usernameInput.fill(process.env.SAUCEDEMO_USERNAME!!)
      await this.passwordInput.fill(process.env.SAUCEDEMO_PASSWORD!!)
      await this.loginButton.click()
    }

}