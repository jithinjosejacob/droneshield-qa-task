import { Page } from '@playwright/test'
import { BasePage } from './BasePage'
import { kebabCaseConversion } from 'utilites/kebabCase'

export class CartPage extends BasePage {
    readonly page: Page
    constructor(page: Page) {
        super()
        this.page = page
    }

    async addProductToCart(productname: string) {
        const kebabCaseOutput = kebabCaseConversion(productname)
        await this.page.locator(`#${kebabCaseOutput}`).click()
        await this.page.locator('data-test=shopping-cart-link').click()
    }

}