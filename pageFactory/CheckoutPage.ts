import { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class CheckoutPage extends BasePage {
    readonly page: Page
    readonly checkoutLink: Locator

    constructor(page: Page) {
        super()
        this.page = page
        this.checkoutLink = page.locator('[data-test="checkout"]')
    }

    async verifyCheckoutPageVisibility() {
        const checkoutPage = await this.checkoutLink.boundingBox()
        return checkoutPage ? true : false
    }

}