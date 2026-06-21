import { until, By } from 'selenium-webdriver';

export class BasePage {
    constructor(driver) {
        this.driver = driver;
        this.timeout = 10000;
    }

    async waitAndFind(selector, timeout = this.timeout) {
        const element = await this.driver.wait(until.elementLocated(selector), timeout);
        await this.driver.wait(until.elementIsVisible(element), timeout);
        return element;
    }

    async click(selector) {
        const element = await this.waitAndFind(selector);
        await element.click();
    }

    async type(selector, text) {
        const element = await this.waitAndFind(selector);
        await element.sendKeys(text);
    }

    async getText(selector) {
        const element = await this.waitAndFind(selector);
        return await element.getText();
    }

    async getUrl() {
        return await this.driver.getCurrentUrl();
    }

    async navigate(url) {
        await this.driver.get(url);
    }
}
