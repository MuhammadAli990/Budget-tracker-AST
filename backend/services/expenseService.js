import { eq, and } from 'drizzle-orm';
import { expenses, budgets, transactions } from '../db/schema.js';

export const createExpense = async (db, userId, budgetId, name) => {
    // Verify budget exists and belongs to user
    const budgetExists = await db
        .select({ id: budgets.id })
        .from(budgets)
        .where(and(eq(budgets.id, parseInt(budgetId)), eq(budgets.userId, userId)))
        .limit(1);

    if (budgetExists.length === 0) {
        throw {
            statusCode: 404,
            message: 'Budget not found or unauthorized.',
            data: {},
        };
    }

    // Check if expense name already exists for this budget
    const expenseExists = await db
        .select({ id: expenses.id })
        .from(expenses)
        .where(and(eq(expenses.budgetId, parseInt(budgetId)), eq(expenses.name, String(name).trim())))
        .limit(1);

    if (expenseExists.length > 0) {
        throw {
            statusCode: 409,
            message: 'Expense with this name already exists for this budget.',
            data: {},
        };
    }

    const insertedExpenses = await db
        .insert(expenses)
        .values({
            name: String(name).trim(),
            budgetId: parseInt(budgetId),
        })
        .returning({
            id: expenses.id,
            name: expenses.name,
            amount: expenses.amount,
            budgetId: expenses.budgetId,
        });

    return insertedExpenses[0];
};

export const getExpensesByBudget = async (db, userId, budgetId) => {
    // Verify budget exists and belongs to user
    const budgetExists = await db
        .select({ id: budgets.id })
        .from(budgets)
        .where(and(eq(budgets.id, parseInt(budgetId)), eq(budgets.userId, userId)))
        .limit(1);

    if (budgetExists.length === 0) {
        throw {
            statusCode: 404,
            message: 'Budget not found or unauthorized.',
            data: {},
        };
    }

    return await db
        .select({
            id: expenses.id,
            name: expenses.name,
            amount: expenses.amount,
            budgetId: expenses.budgetId,
        })
        .from(expenses)
        .where(eq(expenses.budgetId, parseInt(budgetId)));
};

export const getExpenseById = async (db, expenseId) => {
    return await db
        .select({
            id: expenses.id,
            name: expenses.name,
            amount: expenses.amount,
            budgetId: expenses.budgetId,
        })
        .from(expenses)
        .where(eq(expenses.id, parseInt(expenseId)))
        .limit(1);
};

export const updateExpense = async (db, userId, expenseId, name) => {
    // Get expense with its budget
    const expenseToUpdate = await db
        .select({
            id: expenses.id,
            budgetId: expenses.budgetId,
        })
        .from(expenses)
        .where(eq(expenses.id, parseInt(expenseId)))
        .limit(1);

    if (expenseToUpdate.length === 0) {
        throw {
            statusCode: 404,
            message: 'Expense not found.',
            data: {},
        };
    }

    // Verify budget ownership
    const budgetResult = await db
        .select({ userId: budgets.userId })
        .from(budgets)
        .where(eq(budgets.id, expenseToUpdate[0].budgetId))
        .limit(1);

    if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
        throw {
            statusCode: 403,
            message: 'Unauthorized.',
            data: {},
        };
    }

    const updatedExpenses = await db
        .update(expenses)
        .set({ name: String(name).trim() })
        .where(eq(expenses.id, parseInt(expenseId)))
        .returning({
            id: expenses.id,
            name: expenses.name,
            amount: expenses.amount,
            budgetId: expenses.budgetId,
        });

    return updatedExpenses[0];
};

export const deleteExpense = async (db, userId, expenseId) => {
    const expenseToDelete = await db
        .select({
            id: expenses.id,
            amount: expenses.amount,
            budgetId: expenses.budgetId,
        })
        .from(expenses)
        .where(eq(expenses.id, parseInt(expenseId)))
        .limit(1);

    if (expenseToDelete.length === 0) {
        throw {
            statusCode: 404,
            message: 'Expense not found.',
            data: {},
        };
    }

    // Verify budget ownership
    const budgetOwner = await db
        .select({ userId: budgets.userId, amount: budgets.amount })
        .from(budgets)
        .where(eq(budgets.id, expenseToDelete[0].budgetId))
        .limit(1);

    if (budgetOwner.length === 0 || budgetOwner[0].userId !== userId) {
        throw {
            statusCode: 403,
            message: 'Unauthorized.',
            data: {},
        };
    }

    // Restore budget amount if expense had charges
    if (expenseToDelete[0].amount > 0) {
        await db
            .update(budgets)
            .set({ amount: budgetOwner[0].amount + expenseToDelete[0].amount })
            .where(eq(budgets.id, expenseToDelete[0].budgetId));
    }

    // Delete related transactions
    await db.delete(transactions).where(eq(transactions.expenseId, parseInt(expenseId)));
    
    // Delete expense
    await db.delete(expenses).where(eq(expenses.id, parseInt(expenseId)));
};
