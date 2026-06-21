import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';
import { config } from '../config/config.js';

export class LoginPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.emailInput = By.name('email');
        this.passwordInput = By.name('password');
        this.loginButton = By.css('button[type="submit"]');
        this.registerLink = By.linkText('Register');
        this.errorMessage = By.css('.text-red-200');
        this.successMessage = By.css('.text-green-200');
    }

    async load() {
        await this.navigate(`${config.baseUrl}/login`);
    }

    async login(email, password) {
        await this.type(this.emailInput, email);
        await this.type(this.passwordInput, password);
        await this.click(this.loginButton);
    }
}
