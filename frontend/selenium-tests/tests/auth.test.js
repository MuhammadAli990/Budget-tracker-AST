import { expect } from 'chai';
import { createDriver } from '../utils/driver.js';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { config } from '../config/config.js';

describe('BudgetTracker UI Tests', function () {
    let driver;
    let loginPage;
    let dashboardPage;
    let landingPage;

    this.timeout(120000);

    before(async function () {
        driver = await createDriver();
        loginPage = new LoginPage(driver);
        dashboardPage = new DashboardPage(driver);
        landingPage = new LandingPage(driver);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('Test 1: Should load the Landing Page and verify Hero text', async function () {
        await landingPage.load();
        await driver.sleep(2000); // Visual slow down
        const heading = await landingPage.getText(landingPage.heroHeading);
        expect(heading).to.contain('Master your money');
    });

    it('Test 2: Should navigate from Landing to Login', async function () {
        await landingPage.load();
        await driver.sleep(2000); // Visual slow down
        await landingPage.click(landingPage.signInLink);
        await driver.sleep(2000); // Visual slow down
        const url = await driver.getCurrentUrl();
        expect(url).to.contain('/login');
    });

    it('Test 3: Should show error on invalid login submission', async function () {
        await loginPage.load();
        await driver.sleep(2000); // Visual slow down
        await loginPage.login('invalid@example.com', 'wrongpassword');
        await driver.sleep(2000); // Visual slow down
        
        const error = await loginPage.getText(loginPage.errorMessage);
        expect(error).to.not.be.empty;
        expect(error).to.contain('Invalid email or password.');
    });
});
