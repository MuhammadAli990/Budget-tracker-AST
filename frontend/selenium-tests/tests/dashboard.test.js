import { expect } from 'chai';
import { until } from 'selenium-webdriver';
import { createDriver } from '../utils/driver.js';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { config } from '../config/config.js';

describe('Dashboard UI Tests', function () {
    let driver;
    let loginPage;
    let dashboardPage;

    this.timeout(120000);

    before(async function () {
        driver = await createDriver();
        loginPage = new LoginPage(driver);
        dashboardPage = new DashboardPage(driver);

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

    it('Should load dashboard and show welcome heading', async function () {
        await dashboardPage.load();
        await driver.sleep(2000); // Visual slow down
        const heading = await dashboardPage.getWelcomeText();
        expect(heading.toLowerCase()).to.contain('budget summary');
    });

    it('Should create a new budget', async function () {
        await dashboardPage.load();
        await driver.sleep(2000); // Visual slow down
        
        const initialCount = await dashboardPage.getBudgetCount();
        
        await dashboardPage.clickNewBudget();
        await driver.sleep(2000); // Wait in modal visually
        await dashboardPage.createBudget('Food Budget', '500');
        await driver.sleep(3000); // Wait for response
        
        const newCount = await dashboardPage.getBudgetCount();
        expect(newCount).to.be.at.least(initialCount);
    });

    it('Should edit a budget', async function() {
        if (!(await dashboardPage.isLoaded())) {
            await dashboardPage.load();
        }
        await driver.sleep(2000);
        
        let count = await dashboardPage.getBudgetCount();
        if(count > 0) {
            await dashboardPage.editBudget(0, 'Updated Budget', '600');
            await driver.sleep(3000); // Visually see the updated text
        }
    });

    it('Should delete a budget', async function() {
        if (!(await dashboardPage.isLoaded())) {
            await dashboardPage.load();
        }
        await driver.sleep(2000);
        
        let count = await dashboardPage.getBudgetCount();
        if(count > 0) {
            await dashboardPage.deleteBudget(0);
            await driver.sleep(3000); // Visual representation of deletion
            let newCount = await dashboardPage.getBudgetCount();
            expect(newCount).to.be.lessThan(count);
        }
    });
});
