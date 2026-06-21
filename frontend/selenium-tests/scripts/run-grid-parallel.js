import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const TEST_FILES = [
    'tests/auth.test.js',
    'tests/dashboard.test.js',
    'tests/budget.test.js',
];

async function runTestFile(browserName, testFile, userEmail) {
    console.log(`  [${browserName}] Running: ${testFile} as ${userEmail}...`);

    const env = {
        ...process.env,
        BROWSER: browserName,
        TEST_EMAIL: userEmail,
    };

    // Completely bypass Grid java server for maximum stability and speed
    delete env.SELENIUM_REMOTE_URL;

    try {
        const { stdout, stderr } = await execPromise(
            `npx mocha ${testFile} --timeout 150000 --exit`,
            {
                cwd: PROJECT_ROOT,
                timeout: 180000,
                env: env
            }
        );
        console.log(`  [${browserName}] ✔ PASSED: ${testFile}`);
        return { testFile, passed: true };
    } catch (error) {
        const out = error.stdout || '';
        const err = error.stderr || error.message || '';
        console.error(`  [${browserName}] ✘ FAILED: ${testFile}\n${out.substring(0, 500)}\n${err}`);
        return { testFile, passed: false };
    }
}

async function runSuite(browserName, userEmail) {
    console.log(`\n===== Starting suite on [${browserName}] for ${userEmail} =====`);
    const results = [];
    for (const testFile of TEST_FILES) {
        results.push(await runTestFile(browserName, testFile, userEmail));
    }
    return results;
}

async function main() {
    console.log(`Starting Local Parallel Execution (Bypassing Grid for stability)...\n`);

    // Use different emails so browsers don't delete each other's data
    const chromeEmail = 'testuser@example.com';
    const edgeEmail = 'edgeuser@example.com'; // Note: Ensure this user exists or is registered

    // If one of these users isn't registered, the login tests might fail.
    // However, this prevents data collision.

    const chromePromise = runSuite('chrome', chromeEmail);

    // Wait a bit to stagger windows
    await new Promise(r => setTimeout(r, 10000));

    const edgePromise = runSuite('MicrosoftEdge', edgeEmail);

    const [chromeResults, edgeResults] = await Promise.all([chromePromise, edgePromise]);

    console.log('\n========== FINAL SUMMARY ==========');
    console.log(`--- chrome (${chromeEmail}) ---`);
    chromeResults.forEach(r => console.log(`  ${r.passed ? '✔' : '✘'} ${r.testFile}`));
    console.log(`--- MicrosoftEdge (${edgeEmail}) ---`);
    edgeResults.forEach(r => console.log(`  ${r.passed ? '✔' : '✘'} ${r.testFile}`));
}

main();
