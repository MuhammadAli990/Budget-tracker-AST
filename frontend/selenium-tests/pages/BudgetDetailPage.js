import { By, until } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';
import { config } from '../config/config.js';

export class BudgetDetailPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.heading = By.css('h1');
        this.backButton = By.xpath("//button[contains(., 'Back to Dashboard')]");
        this.newExpenseButton = By.xpath("//button[contains(., 'New Expense')]");
        
        // Create Expense Modal
        this.expenseNameInput = By.name('name');
        this.createExpenseSubmitButton = By.xpath("//button[@type='submit' and contains(., 'Create')]");
        
        this.expenseCards = By.xpath("//div[contains(@class, 'border-white/10') and .//p[contains(@class, 'text-zinc-300/90')]]");
        this.message = By.css('.text-green-200');

        // Add Transaction Modal
        this.transactionNameInput = By.name('name');
        this.transactionAmountInput = By.name('amount');
        this.transactionDateInput = By.name('date');
        this.createTransactionSubmitButton = By.xpath("//button[@type='submit' and contains(., 'Add Transaction')]");

        // Backdrop overlay selector
        this.backdrop = By.css('div.absolute.inset-0.bg-black\\/60');
    }

    /**
     * Wait until no modal backdrop is covering the page.
     * Retries for up to `ms` milliseconds.
     */
    async waitForModalToClear(ms = 5000) {
        try {
            await this.driver.wait(async () => {
                const overlays = await this.driver.findElements(this.backdrop);
                return overlays.length === 0;
            }, ms);
        } catch (_) {
            // If it times out we proceed anyway; the JS-click below will handle it
        }
        // Extra breathing room for CSS transition to finish
        await this.driver.sleep(500);
    }

    /**
     * Click an element via JavaScript to bypass any overlay interception.
     */
    async jsClick(element) {
        await this.driver.executeScript('arguments[0].click();', element);
    }

    async getHeadingText() {
        return await this.getText(this.heading);
    }

    async clickNewExpense() {
        await this.waitForModalToClear();
        // Explicitly wait for the button to appear – the page may still be fetching data
        await this.driver.wait(until.elementLocated(this.newExpenseButton), 15000);
        const btn = await this.driver.findElement(this.newExpenseButton);
        await this.driver.executeScript('arguments[0].click();', btn);
        await this.driver.wait(until.elementLocated(this.expenseNameInput), 5000);
    }

    async createExpense(name) {
        await this.type(this.expenseNameInput, name);
        await this.click(this.createExpenseSubmitButton);
    }

    async getExpenseCount() {
        const elements = await this.driver.findElements(this.expenseCards);
        return elements.length;
    }

    async clickAddTransaction(index = 0) {
        await this.waitForModalToClear();
        const elements = await this.driver.findElements(this.expenseCards);
        if (elements.length > index) {
            // Match bg-purple-600 and variants like bg-purple-600/80
            const addBtn = await elements[index].findElement(
                By.xpath(".//button[contains(@class, 'bg-purple-600') or contains(@class, 'bg-purple-500')][not(contains(@class, 'bg-red'))]"
            ));
            await this.jsClick(addBtn);
            await this.driver.wait(until.elementLocated(this.transactionNameInput), 8000);
        }
    }

    async addTransaction(name, amount, date) {
        await this.type(this.transactionNameInput, name);
        await this.type(this.transactionAmountInput, amount);
        await this.type(this.transactionDateInput, date);
        await this.click(this.createTransactionSubmitButton);
    }

    async deleteExpense(index = 0) {
        await this.waitForModalToClear();
        const elements = await this.driver.findElements(this.expenseCards);
        if (elements.length > index) {
            const card = elements[index];

            // Scroll card into the center of the viewport so it is clearly visible
            await this.driver.executeScript(
                'arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });',
                card
            );
            await this.driver.sleep(800); // Wait for smooth scroll to finish

            const delBtn = await card.findElement(By.xpath(".//button[contains(@class, 'bg-red-600')]"));

            // Visually highlight the delete button with a glowing border so the viewer can see it
            await this.driver.executeScript(
                `arguments[0].style.outline = '3px solid red';
                 arguments[0].style.boxShadow = '0 0 12px 4px rgba(255,0,0,0.7)';`,
                delBtn
            );
            await this.driver.sleep(1500); // Pause so viewer sees the target

            // Remove highlight then click
            await this.driver.executeScript(
                `arguments[0].style.outline = '';
                 arguments[0].style.boxShadow = '';`,
                delBtn
            );
            await this.jsClick(delBtn);
        }
    }

    async viewTransactions(index = 0) {
        await this.waitForModalToClear();
        const elements = await this.driver.findElements(this.expenseCards);
        if (elements.length > index) {
            await this.jsClick(elements[index]); // JS-click bypasses any residual overlay
        }
    }

    async deleteTransaction(index = 0) {
        // Wait for the transactions modal to appear (heading ends with '- Transactions')
        const modalXpath = "//div[contains(@class, 'z-50') and .//h2[contains(., 'Transactions')]]";
        await this.driver.wait(until.elementLocated(By.xpath(modalXpath)), 8000);
        const modal = await this.driver.findElement(By.xpath(modalXpath));
        const delBtns = await modal.findElements(By.xpath(".//button[contains(@class, 'bg-red-600')]"));
        if (delBtns.length > index) {
            await delBtns[index].click();
        }
    }

    /**
     * Close the transactions modal and wait for it to fully disappear.
     * The modal is dismissed by clicking the X button (lucide-x icon).
     */
    async closeTransactionsModal() {
        try {
            // The X button inside any z-50 overlay
            const closeXpath = "//div[contains(@class, 'z-50')]//button[.//*[local-name()='svg']]";
            const closeBtns = await this.driver.findElements(By.xpath(closeXpath));
            // The last svg button in the z-50 panel is the X close button
            if (closeBtns.length > 0) {
                await this.jsClick(closeBtns[closeBtns.length - 1]);
            }
        } catch (_) {
            // Modal may already be gone
        }
        await this.waitForModalToClear(6000);
    }
}
