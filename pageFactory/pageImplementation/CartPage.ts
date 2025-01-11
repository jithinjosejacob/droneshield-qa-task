import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class CartPage extends BasePage {
    constructor (page: Page) {
      super()
    }
  
  
    // Navigate to URL.
    async navigateToURL (baseURL: any) {
    }
}