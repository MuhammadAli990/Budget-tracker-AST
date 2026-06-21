# Selenium UI Automation for BudgetTracker-AST

This folder contains the UI automation suite for the BudgetTracker-AST frontend application using Selenium WebDriver, JavaScript (Node.js), and Mocha.

## **File Structure**
- `tests/`: Contains test suites (Mocha/Chai).
- `pages/`: Page Object Model (POM) implementation.
- `utils/`: Utility functions like driver initialization.
- `config/`: Configuration for URLs and credentials.

## **Prerequisites**
- Node.js (v18+)
- pnpm (or npm)
- Google Chrome installed

## **Setup Instructions**
1. Navigate to the frontend directory:
   ```bash
   cd frontend/selenium-tests
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```

## **Running Tests**
Ensure the application is running at `http://localhost:5173` before starting tests.

Run all tests:
```bash
pnpm test
```

## **Key Features**
- **Page Object Model**: Reusable page classes for cleaner tests.
- **Explicit Waits**: Stable tests that wait for elements to be interactable.
- **Configurable**: Easily change URLs or browser settings in `config/config.js`.
- **No Side Effects**: Tests are designed to be safe for production environments where possible (using non-destructive checks).

## **Dependencies**
- `selenium-webdriver`: Core library for browser interaction.
- `chromedriver`: Driver implementation for Chrome.
- `mocha`: Test runner framework.
- `chai`: Assertion library.
