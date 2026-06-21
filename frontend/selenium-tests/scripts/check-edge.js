import { Builder } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';

async function test() {
    console.log("Checking Edge capabilities...");
    try {
        let driver = await new Builder()
            .forBrowser('MicrosoftEdge')
            .build();
        console.log("SUCCESS: Edge launched!");
        await driver.quit();
    } catch (e) {
        console.error("FAILURE: Could not launch Edge.");
        console.error(e.message);
    }
}

test();
