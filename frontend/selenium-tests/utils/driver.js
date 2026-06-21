import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import firefox from 'selenium-webdriver/firefox.js';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export async function createDriver() {
    const browserName = process.env.BROWSER || 'chrome';
    const remoteUrl = process.env.SELENIUM_REMOTE_URL;

    // Write browser temp profiles to user AppData\Local\Temp, NOT C:\Windows\SystemTemp
    // This avoids "not enough space on disk" crashes on the system temp drive
    const userDataDir = mkdtempSync(join(tmpdir(), `sel-${browserName}-`));

    let builder = new Builder().forBrowser(browserName);

    if (browserName === 'chrome') {
        const options = new chrome.Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--start-maximized');
        options.addArguments(`--user-data-dir=${userDataDir}`);
        options.addArguments('--disk-cache-size=1');
        options.addArguments('--disable-extensions');
        options.addArguments('--no-first-run');
        builder = builder.setChromeOptions(options);
    } else if (browserName === 'MicrosoftEdge') {
        const options = new edge.Options();
        options.addArguments('--start-maximized');
        options.addArguments(`--user-data-dir=${userDataDir}`);
        options.addArguments('--disk-cache-size=1');
        options.addArguments('--disable-extensions');
        options.addArguments('--no-first-run');
        builder = builder.setEdgeOptions(options);
    } else if (browserName === 'firefox') {
        const options = new firefox.Options();
        builder = builder.setFirefoxOptions(options);
    }

    if (remoteUrl) {
        builder = builder.usingServer(remoteUrl);
    }

    const driver = await builder.build();

    if (browserName !== 'chrome' && browserName !== 'MicrosoftEdge') {
        await driver.manage().window().maximize();
    }

    return driver;
}
