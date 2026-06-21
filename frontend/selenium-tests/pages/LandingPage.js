import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';
import { config } from '../config/config.js';

export class LandingPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.getStartedButton = By.xpath("//button[contains(text(), 'Get Started')]");
        this.signInLink = By.linkText('Sign in');
        this.heroHeading = By.css('h1');
    }

    async load() {
        await this.navigate(config.baseUrl);
    }

    async clickGetStarted() {
        await this.click(this.getStartedButton);
    }
}
