import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';
import { config } from '../config/config.js';

export class RegisterPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.nameInput = By.name('name');
        this.emailInput = By.name('email');
        this.passwordInput = By.name('password');
        this.submitButton = By.css('button[type="submit"]');
        this.errorMessage = By.css('.text-red-200');
        this.successMessage = By.css('.text-green-200');
        this.heading = By.css('h1');
    }

    async load() {
        await this.navigate(`${config.baseUrl}/register`);
    }

    async register(name, email, password) {
        await this.type(this.nameInput, name);
        await this.type(this.emailInput, email);
        await this.type(this.passwordInput, password);
        await this.click(this.submitButton);
    }
}
