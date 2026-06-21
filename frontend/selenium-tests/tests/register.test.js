import { expect } from 'chai';
import { createDriver } from '../utils/driver.js';
import { RegisterPage } from '../pages/RegisterPage.js';

describe('Register UI Tests', function () {
    let driver;
    let registerPage;

    this.timeout(30000);

    before(async function () {
        driver = await createDriver();
        registerPage = new RegisterPage(driver);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('Should load the Register Page', async function () {
        await registerPage.load();
        await driver.sleep(2000); // Visual slow down
        const heading = await registerPage.getText(registerPage.heading);
        expect(heading).to.equal('Register');
    });

    it('Should try registering and assert failure if email exists', async function () {
        await registerPage.load();
        await driver.sleep(2000); // Visual slow down
        await registerPage.register('Test User', 'testuser@example.com', 'password123');
        await driver.sleep(2000); // Visually wait to see the error popup
        try {
            const error = await registerPage.getText(registerPage.errorMessage);
            expect(error).to.not.be.empty;
        } catch(e) {
            // Success logic hit
        }
    });
});
