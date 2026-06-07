import { eq, and } from 'drizzle-orm';
import { budgets, expenses, transactions } from '../db/schema.js';

export const createBudget = async (db, userId, amount, name) => {
    const totalAmount = parseInt(amount);

    const insertedBudgets = await db
        .insert(budgets)
        .values({
            totalAmount,
            amount: totalAmount,
            name: String(name).trim(),
            userId,
        })
        .returning({
            id: budgets.id,
            totalAmount: budgets.totalAmount,
            amount: budgets.amount,
            name: budgets.name,
            userId: budgets.userId,
        });

    return insertedBudgets[0];
};

export const getBudgetsByUser = async (db, userId) => {
    return await db
        .select({
            id: budgets.id,
            totalAmount: budgets.totalAmount,
            amount: budgets.amount,
            name: budgets.name,
            userId: budgets.userId,
        })
        .from(budgets)
        .where(eq(budgets.userId, userId));
};

export const getBudgetById = async (db, budgetId, userId) => {
    return await db
        .select({
            id: budgets.id,
            userId: budgets.userId,
            totalAmount: budgets.totalAmount,
            amount: budgets.amount,
            name: budgets.name,
        })
        .from(budgets)
        .where(and(eq(budgets.id, parseInt(budgetId)), eq(budgets.userId, userId)))
        .limit(1);
};

export const updateBudget = async (db, budgetId, userId, updateData) => {
    // Validate ownership
    const budgetToUpdate = await getBudgetById(db, budgetId, userId);
    
    if (budgetToUpdate.length === 0) {
        throw {
            statusCode: 404,
            message: 'Budget not found or unauthorized.',
            data: {},
        };
    }

    const updates = {};
    
    if (updateData.amount) {
        const newTotalAmount = parseInt(updateData.amount);
        const oldTotalAmount = budgetToUpdate[0].totalAmount;
        const currentAmount = budgetToUpdate[0].amount;
        const difference = newTotalAmount - oldTotalAmount;
        const newRemainingAmount = currentAmount + difference;

        updates.totalAmount = newTotalAmount;
        updates.amount = newRemainingAmount;
    }
    
    if (updateData.name) {
        updates.name = String(updateData.name).trim();
    }

    const updatedBudgets = await db
        .update(budgets)
        .set(updates)
        .where(eq(budgets.id, parseInt(budgetId)))
        .returning({
            id: budgets.id,
            totalAmount: budgets.totalAmount,
            amount: budgets.amount,
            name: budgets.name,
            userId: budgets.userId,
        });

    return updatedBudgets[0];
};

export const deleteBudget = async (db, budgetId, userId) => {
    // Validate ownership
    const budgetToDelete = await getBudgetById(db, budgetId, userId);
    
    if (budgetToDelete.length === 0) {
        throw {
            statusCode: 404,
            message: 'Budget not found or unauthorized.',
            data: {},
        };
    }

    // Delete all related transactions and expenses
    const relatedExpenses = await db
        .select({ id: expenses.id })
        .from(expenses)
        .where(eq(expenses.budgetId, parseInt(budgetId)));

    for (const expense of relatedExpenses) {
        await db.delete(transactions).where(eq(transactions.expenseId, expense.id));
    }

    await db.delete(expenses).where(eq(expenses.budgetId, parseInt(budgetId)));
    await db.delete(budgets).where(eq(budgets.id, parseInt(budgetId)));
};
