import { By, until } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';
import { config } from '../config/config.js';

export class DashboardPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.welcomeHeading = By.css('h1');
        this.newBudgetButton = By.xpath("//button[contains(., 'New Budget')]");

        // Create Budget Modal — scope selectors INSIDE the modal form to avoid
        // collisions with the inline-edit inputs that also use name="name"/"amount".
        this.budgetNameInput    = By.css('form[class*="rounded-2xl"] input[name="name"]');
        this.budgetAmountInput  = By.css('form[class*="rounded-2xl"] input[name="amount"]');
        this.createBudgetSubmitButton = By.css('form[class*="rounded-2xl"] button[type="submit"]');

        this.budgetCards  = By.css('.grid > div.relative');
        this.loadingState = By.xpath("//p[contains(text(), 'Loading budgets')]");
    }


    
    async load() {
        await this.navigate(`${config.baseUrl}/dashboard`);
    }

    async isLoaded() {
        const url = await this.getUrl();
        return url.includes('/dashboard');
    }

    async getWelcomeText() {
        return await this.getText(this.welcomeHeading);
    }

    async clickNewBudget() {
        // Retry clicking "New Budget" up to 3 times to handle Chrome interception.
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const btn = await this.driver.findElement(this.newBudgetButton);
                await this.driver.executeScript('arguments[0].click();', btn);

                // Wait for the create modal form to appear (10 s on Chrome)
                await this.driver.wait(until.elementLocated(this.budgetNameInput), 10000);
                const input = await this.driver.findElement(this.budgetNameInput);
                await this.driver.wait(until.elementIsVisible(input), 5000);
                return; // success
            } catch (err) {
                if (attempt === 3) throw err;
                await this.driver.sleep(1000);
            }
        }
    }

    async createBudget(name, amount) {
        await this.type(this.budgetNameInput, name);
        await this.type(this.budgetAmountInput, amount);
        await this.click(this.createBudgetSubmitButton);
    }

    async getBudgetCount() {
        try {
            const loaders = await this.driver.findElements(this.loadingState);
            if (loaders.length > 0) {
                await this.driver.wait(until.stalenessOf(loaders[0]), 10000);
            }
        } catch (e) { /* already gone */ }

        await this.driver.sleep(1500);
        const elements = await this.driver.findElements(this.budgetCards);
        return elements.length;
    }

    async clickBudgetCard(index = 0) {
        const elements = await this.driver.findElements(this.budgetCards);
        if (elements.length > index) {
            await this.driver.executeScript('arguments[0].click();', elements[index]);
            await this.driver.wait(until.urlContains('/budgets/'), 10000);
        }
    }

    async editBudget(index, newName, newAmount) {
        const elements = await this.driver.findElements(this.budgetCards);
        if (elements.length <= index) return;

        const card = elements[index];

        // The edit button has class `bg-white/5` (the only such button in the card).
        // Use XPath contains() to match it regardless of Tailwind's slash escaping.
        const editBtn = await card.findElement(
            By.xpath(".//button[contains(@class,'bg-white')]")
        );
        await this.driver.executeScript('arguments[0].click();', editBtn);

        // The edit panel renders as `fixed inset-0 z-50` at document level.
        // Locate inputs there — NOT scoped to card — to avoid stale-element errors.
        const editNameSel = By.css('div.fixed.inset-0.z-50 input[name="name"]');
        await this.driver.wait(until.elementLocated(editNameSel), 8000);
        await this.driver.sleep(400);

        const nameInput   = await this.driver.findElement(By.css('div.fixed.inset-0.z-50 input[name="name"]'));
        const amountInput = await this.driver.findElement(By.css('div.fixed.inset-0.z-50 input[name="amount"]'));

        // Clear via JS (React needs 'input' event to register controlled component change)
        await this.driver.executeScript(
            `arguments[0].value=''; arguments[0].dispatchEvent(new Event('input',{bubbles:true}));`,
            nameInput
        );
        await nameInput.sendKeys(newName);

        await this.driver.executeScript(
            `arguments[0].value=''; arguments[0].dispatchEvent(new Event('input',{bubbles:true}));`,
            amountInput
        );
        await amountInput.sendKeys(newAmount);

        // Save — JS-click to bypass overlay interception
        const saveBtn = await this.driver.findElement(By.css('div.fixed.inset-0.z-50 button.bg-green-600'));
        await this.driver.executeScript('arguments[0].click();', saveBtn);

        // Wait for overlay to close
        await this.driver.wait(until.stalenessOf(saveBtn), 8000).catch(() => {});
    }

    async deleteBudget(index) {
        const elements = await this.driver.findElements(this.budgetCards);
        if (elements.length <= index) return;

        const card = elements[index];

        // The delete button has class `bg-red-600/80` — scoped to the card so it
        // won't match the cancel (X) button in an edit overlay (which is `fixed`).
        const delBtn = await card.findElement(
            By.xpath(".//button[contains(@class,'bg-red-600')]")
        );
        await this.driver.executeScript('arguments[0].click();', delBtn);
    }
}
