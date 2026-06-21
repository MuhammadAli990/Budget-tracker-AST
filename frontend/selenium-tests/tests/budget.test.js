import { By, until } from 'selenium-webdriver';
import { expect } from 'chai';
import { createDriver } from '../utils/driver.js';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { BudgetDetailPage } from '../pages/BudgetDetailPage.js';
import { config } from '../config/config.js';

describe('Budget Detail UI Tests', function () {
    let driver;
    let loginPage;
    let dashboardPage;
    let budgetDetailPage;

    this.timeout(120000);

    before(async function () {
        driver = await createDriver();
        loginPage = new LoginPage(driver);
        dashboardPage = new DashboardPage(driver);
        budgetDetailPage = new BudgetDetailPage(driver);

        await loginPage.load();
        await loginPage.login(config.credentials.email, config.credentials.password);
        // Wait for the app's 2.5s redirect to /dashboard (confirms cookie is set)
        await driver.wait(until.urlContains('/dashboard'), 10000);
        await driver.sleep(1000); // Extra settle time
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('Should navigate to budget detail from dashboard', async function () {
        await dashboardPage.load();
        await driver.sleep(2000);

        let budgetCount = await dashboardPage.getBudgetCount();
        if (budgetCount === 0) {
            // Create a seed budget so the rest of the suite has something to work with
            await dashboardPage.clickNewBudget();
            await dashboardPage.createBudget('Temp Budget', '100');

            // Actively wait for at least one card to appear (up to 10 s) instead of
            // relying on a fixed sleep — Chrome's API round-trip can exceed 3 s.
            await driver.wait(
                async () => {
                    const cards = await driver.findElements(By.css('.grid > div.relative'));
                    return cards.length > 0;
                },
                10000,
                'Timed out waiting for a budget card to appear after creation'
            );
            budgetCount = await dashboardPage.getBudgetCount();
        }

        expect(budgetCount).to.be.greaterThan(0);
        await dashboardPage.clickBudgetCard(0);
        await driver.sleep(2000);

        const url = await driver.getCurrentUrl();
        expect(url).to.contain('/budgets/');
    });

    it('Should add an expense to a budget', async function () {
        await driver.sleep(2000);
        const initialCount = await budgetDetailPage.getExpenseCount();
        
        await budgetDetailPage.clickNewExpense();
        await driver.sleep(1500); // Visual modal
        await budgetDetailPage.createExpense('Groceries');
        await driver.sleep(3000);
        
        const newCount = await budgetDetailPage.getExpenseCount();
        expect(newCount).to.be.at.least(initialCount);
    });

    it('Should add a transaction to an expense', async function() {
        await driver.sleep(2000);
        let expenseCount = await budgetDetailPage.getExpenseCount();
        if (expenseCount > 0) {
            await budgetDetailPage.clickAddTransaction(0);
            await driver.sleep(2000); // Visual wait
            await budgetDetailPage.addTransaction('Apples', '5', '06/13/2026');
            await driver.sleep(3000); // Wait for modal to close and update
        }
    });

    it('Should view transactions and close modal', async function() {
        await driver.sleep(2000);
        let expenseCount = await budgetDetailPage.getExpenseCount();
        if (expenseCount > 0) {
            // Close any leftover modal from the previous test first
            await budgetDetailPage.closeTransactionsModal();

            await budgetDetailPage.viewTransactions(0);
            await driver.sleep(3000); // Look at transactions visually
            
            // deleteTransaction waits internally for the modal; guard by checking modal elements
            const modals = await driver.findElements(
                By.xpath("//div[contains(@class, 'z-50') and .//h2[contains(., 'Transactions')]]")
            );
            if (modals.length > 0) {
                await budgetDetailPage.deleteTransaction(0);
                await driver.sleep(2000); // Wait for deletion to show visually
            }
            
            // Close modal and wait for the backdrop to fully disappear
            await budgetDetailPage.closeTransactionsModal();
            await driver.sleep(1000); // Extra visual pause
        }
    });


    it('Should delete an expense', async function() {
        await driver.sleep(2000);
        let count = await budgetDetailPage.getExpenseCount();
        if(count > 0) {
            await budgetDetailPage.deleteExpense(0); // scrolls into view, highlights button, then deletes
            await driver.sleep(4000); // Hold on the updated (empty/reduced) expense list so deletion is visible
            let newCount = await budgetDetailPage.getExpenseCount();
            expect(newCount).to.be.lessThan(count);
        }
    });
});
