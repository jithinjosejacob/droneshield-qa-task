import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
    constructor (page: Page) {
      super()
    }
  
  
    // Navigate to URL.
    async navigateToURL (baseURL: any) {
    }
}