# Backend Refactoring Documentation

## Project Structure Overview

The backend has been refactored from a monolithic `index.js` into a modular, maintainable architecture following the MVC (Model-View-Controller) pattern with service layers.

```
backend/
├── middleware/
│   ├── auth.js                 # Authentication middleware
│   └── errorHandler.js         # Global error handling middleware (NEW)
├── controllers/                # (NEW) Request handlers
│   ├── authController.js
│   ├── budgetController.js
│   ├── expenseController.js
│   └── transactionController.js
├── services/                   # (NEW) Business logic layer
│   ├── authService.js
│   ├── budgetService.js
│   ├── expenseService.js
│   └── transactionService.js
├── routes/                     # (NEW) Route definitions
│   ├── auth.js
│   ├── budgets.js
│   ├── expenses.js
│   └── transactions.js
├── utils/                      # (NEW) Utility functions
│   ├── response.js             # Standardized API response helpers
│   └── validators.js           # Input validation utilities
├── db/
│   └── schema.js               # Database schema (existing)
├── drizzle/                    # Database migrations (existing)
├── index.js                    # Main app entry point (refactored)
├── package.json
└── docker-compose.yml
```

## Key Changes

### 1. **Services Layer** (`services/`)
- **Purpose**: Contains all business logic and database operations
- **Benefits**: Reusable functions, easier testing, separation of concerns
- **Files**:
  - `authService.js`: User registration and login logic
  - `budgetService.js`: Budget CRUD operations
  - `expenseService.js`: Expense management
  - `transactionService.js`: Transaction management

### 2. **Controllers Layer** (`controllers/`)
- **Purpose**: Handles HTTP requests and responses
- **Benefits**: Cleaner route files, focused request handling
- **Files**:
  - `authController.js`: Auth endpoints handler
  - `budgetController.js`: Budget endpoints handler
  - `expenseController.js`: Expense endpoints handler
  - `transactionController.js`: Transaction endpoints handler

### 3. **Routes Layer** (`routes/`)
- **Purpose**: Defines API endpoints and connects them to controllers
- **Benefits**: Organized endpoints, easy to understand API structure
- **Files**:
  - `auth.js`: `/auth` routes
  - `budgets.js`: `/budgets` routes
  - `expenses.js`: `/expenses` routes
  - `transactions.js`: `/transactions` routes

### 4. **Utility Functions** (`utils/`)
- **response.js**: Standardized API response formatting
  - `sendSuccess()`: Successful response format
  - `sendError()`: Error response format
- **validators.js**: Input validation utilities
  - `validateRequired()`: Check required fields
  - `validatePositiveInteger()`: Validate positive numbers
  - `validateEmail()`: Email validation

### 5. **Error Handling Middleware** (`middleware/errorHandler.js`)
- **Purpose**: Global error handler for all routes
- **Benefits**: Consistent error responses, centralized error logging
- Catches all errors and formats them consistently

### 6. **Simplified Main File** (`index.js`)
- **Before**: 880 lines with all logic mixed together
- **After**: 36 lines focused on app setup
- **Improvements**:
  - Clean imports
  - Middleware configuration
  - Route mounting
  - Error handler setup

## API Endpoints

All endpoints follow the pattern:
```
POST   /auth/register          # Register a new user
POST   /auth/login             # Login user
POST   /budgets                # Create budget (auth required)
GET    /budgets                # Get all budgets (auth required)
PATCH  /budgets/:id            # Update budget (auth required)
DELETE /budgets/:id            # Delete budget (auth required)
POST   /expenses               # Create expense (auth required)
GET    /expenses?budgetId=...  # Get expenses (auth required)
PATCH  /expenses/:id           # Update expense (auth required)
DELETE /expenses/:id           # Delete expense (auth required)
POST   /transactions           # Create transaction (auth required)
GET    /transactions?expenseId=... # Get transactions (auth required)
PATCH  /transactions/:id       # Update transaction (auth required)
DELETE /transactions/:id       # Delete transaction (auth required)
```

## How Data Flows

**Example: Creating a Transaction**

1. HTTP POST → `/transactions`
2. ↓ Auth middleware validates token
3. ↓ `transactionController.create()` receives request
4. ↓ Validates input data
5. ↓ Calls `transactionService.createTransaction()`
6. ↓ Service handles all business logic and DB operations
7. ↓ Returns result to controller
8. ↓ Controller sends standardized response via `sendSuccess()`
9. ← HTTP 201 with JSON response

## Error Handling

All errors are caught and formatted consistently:
```json
{
  "success": false,
  "message": "Error description",
  "data": {
    "error": "Additional error context"
  }
}
```

## Reusable Code Patterns

### Response Helper Usage
```javascript
// Success
return sendSuccess(res, 201, 'Budget created.', budget);

// Error
return sendError(res, 404, 'Budget not found.', {});
```

### Error Throwing in Services
```javascript
throw {
    statusCode: 404,
    message: 'Budget not found.',
    data: {},
};
```

### Controller Pattern
```javascript
export const functionName = async (req, res, next) => {
    try {
        // Business logic
        const result = await serviceFunction(req.db, ...args);
        return sendSuccess(res, 200, 'Success!', result);
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message);
        }
        next(error); // Pass to error handler
    }
};
```

## Benefits of This Refactoring

✅ **Modularity**: Each file has a single responsibility
✅ **Reusability**: Services can be used across controllers
✅ **Testability**: Each layer can be tested independently
✅ **Maintainability**: Easy to locate and modify code
✅ **Scalability**: Easy to add new features
✅ **Consistency**: Standardized error handling and responses
✅ **Readability**: Clear separation of concerns

## Running the Server

```bash
cd backend
node index.js
# Server runs on http://localhost:3000
```

## Next Steps (Optional Enhancements)

1. **Add input validation middleware** using libraries like `joi` or `zod`
2. **Add logging** using `winston` or similar
3. **Add rate limiting** for API protection
4. **Add request/response caching**
5. **Create API documentation** using Swagger/OpenAPI
6. **Add unit tests** for services and controllers
7. **Add database connection pooling** optimization
