# Backend Unit Tests Summary

This file lists unit tests added under `backend/tests/` with IDs, file, test name, description, input and expected outcome.

| ID | File | Test name | Description | Input | Expected |
|---:|---|---|---|---|---|
| 1 | backend/tests/authService.test.js | loginUser returns token and user | Valid credentials produce token and normalized user | `email='test@example.com', password='secret'` | returns `{ token, user }` with normalized email |
| 2 | backend/tests/authService.test.js | loginUser invalid credentials | Invalid email/password | `email='no@one.com', password='bad'` | throws `{ statusCode: 401 }` |
| 3 | backend/tests/authService.test.js | loginUser rejects empty email | Empty/whitespace email | `email='  ', password='secret'` | throws `{ statusCode: 401 }` |
| 4 | backend/tests/authService.test.js | registerUser conflict | Email already exists | `email='test@example.com', password='p', name='Name'` | throws `{ statusCode: 409 }` |
| 5 | backend/tests/authService.test.js | registerUser success | New user inserted | `email='A@B.COM', password='pw', name=' A '` | returns created user object |
| 6 | backend/tests/budgetService.test.js | createBudget parses amount | Amount string parsed and inserted | `userId=2, amount='100', name=' My Budget '` | returns inserted budget object |
| 7 | backend/tests/budgetService.test.js | createBudget rejects negative amount | Negative amount attempted | `userId=1, amount='-50', name='Negative'` | throws `{ statusCode: 400 }` (FAILS - missing validation) |
| 8 | backend/tests/budgetService.test.js | updateBudget not found | Budget ownership/exists check fails | `budgetId=1, userId=2, update={amount:'200'}` | throws `{ statusCode: 404 }` |
| 9 | backend/tests/budgetService.test.js | updateBudget rejects negative amount | Negative amount update attempted | `budgetId=5, userId=2, update={amount:'-200'}` | throws `{ statusCode: 400 }` (FAILS - missing validation) |
|10 | backend/tests/budgetService.test.js | updateBudget amount change | Amount updated and remaining adjusted | `budgetId=5, userId=2, update={amount:'200'}` | returns updated budget with new totals |
|11 | backend/tests/transactionService.test.js | createTransaction invalid amount | Non-positive or NaN amounts | `userId=1, name='t', amount=0, date='2020-01-01', expenseId=1` | throws `{ statusCode: 400 }` |
|12 | backend/tests/transactionService.test.js | createTransaction expense not found | Expense lookup empty | `userId=1, amount=10, expenseId=999` | throws `{ statusCode: 404 }` |
|13 | backend/tests/transactionService.test.js | createTransaction unauthorized budget | Budget belongs to different user | `userId=1, amount=10, expenseId=1 (budget.userId!=1)` | throws `{ statusCode: 403 }` |
|14 | backend/tests/transactionService.test.js | createTransaction success | Normal transaction flow (insert & updates) | `userId=1, name='T', amount=10, date='2020-01-01', expenseId=1` | returns inserted transaction object |
|15 | backend/tests/transactionService.test.js | updateTransaction rejects negative amount | Negative amount update | `userId=3, transactionId=1, update={amount:'-5'}` | throws `{ statusCode: 400 }` (FAILS - missing validation unless service validates) |
|16 | backend/tests/transactionService.test.js | getTransactionsByExpense unauthorized | Expense not found | `userId=1, expenseId=999` | throws `{ statusCode: 404 }` |
|17 | backend/tests/expenseService.test.js | createExpense throws 404 when budget not found | Budget does not exist | `userId=1, budgetId=999, name='E'` | throws `{ statusCode: 404 }` |
|18 | backend/tests/expenseService.test.js | createExpense success | Budget exists and name unique | `userId=1, budgetId=10, name=' New Expense '` | returns inserted expense object |
|19 | backend/tests/expenseService.test.js | createExpense conflict | Expense name already exists | `userId=1, budgetId=10, name='Dup'` | throws `{ statusCode: 409 }` |
|20 | backend/tests/expenseService.test.js | updateExpense throws 403 when unauthorized | Different user owns budget | `userId=3, expenseId=2, name='New'` | throws `{ statusCode: 403 }` |
|21 | backend/tests/expenseService.test.js | updateExpense authorized | Expense exists and budget owned by user | `userId=3, expenseId=2, name=' New '` | returns updated expense object |
|22 | backend/tests/expenseService.test.js | deleteExpense with amount>0 | Expense exists and had charges | `userId=7, expenseId=9` | calls budget update and deletes relations |

How to run tests

From the repository root run:

```bash
npm --prefix backend test
```

This runs Jest using `node --experimental-vm-modules` to support ESM modules.

If you want verbose output:

```bash
npm --prefix backend test -- --verbose
```
