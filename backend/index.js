import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import budgetRoutes from './routes/budgets.js';
import expenseRoutes from './routes/expenses.js';
import transactionRoutes from './routes/transactions.js';

const db = drizzle(process.env.DATABASE_URL);
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());

// Attach db to request object for use in controllers and services
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/budgets', budgetRoutes);
app.use('/expenses', expenseRoutes);
app.use('/transactions', transactionRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(3000, () => {
    console.log(`Example app listening on port 3000`);
});
