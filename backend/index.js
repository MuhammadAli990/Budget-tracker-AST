import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { users, budgets, expenses, transactions } from './db/schema.js';
import { authMiddleware } from './middleware/auth.js';

const db = drizzle(process.env.DATABASE_URL);
const app = express()

app.use(express.json())
app.use(cors({origin:'http://localhost:5173', credentials:true}))
app.use(cookieParser())

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';


// - api response format:
// {success:true, message:"User registered.", data:{key: "if needed"}}
// - avoid idor (check if user updating or deleting has the rights to do it)

// api to register a user
app.post('/register', async (req,res)=>{
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'email, password and name are required.',
                data: {},
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();
        const normalizedPassword = String(password);

        const existingUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered.',
                data: {},
            });
        }

        const insertedUsers = await db
            .insert(users)
            .values({
                email: normalizedEmail,
                name: normalizedName,
                password: normalizedPassword,
            })
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
            });

        return res.status(201).json({
            success: true,
            message: 'User registered.',
            data: insertedUsers[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to register user.',
            data: { error: error.message },
        });
    }
})

// api to login a user
app.post("/login", async (req,res)=>{
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'email and password are required.',
                data: {},
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const foundUsers = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                password: users.password,
            })
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

        if (foundUsers.length === 0 || foundUsers[0].password !== String(password)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
                data: {},
            });
        }

        const user = foundUsers[0];
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' },
        );

        return res
            .cookie('token', token, {
                httpOnly:true,
                secure:false,
                sameSite:'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            .status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to login user.',
            data: { error: error.message },
        });
    }
})







// Budget (requires auth middleware)

// api to make a budget
app.post("/budgets", authMiddleware, async (req,res)=>{
    try {
        const { amount, name } = req.body;
        const userId = req.user.userId;

        if (!amount || !name) {
            return res.status(400).json({
                success: false,
                message: 'amount and name are required.',
                data: {},
            });
        }

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

        return res.status(201).json({
            success: true,
            message: 'Budget created.',
            data: insertedBudgets[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create budget.',
            data: { error: error.message },
        });
    }
})

// api to get all budgets of a user
app.get("/budgets", authMiddleware, async (req,res)=>{
    try {
        const userId = req.user.userId;

        const userBudgets = await db
            .select({
                id: budgets.id,
                totalAmount: budgets.totalAmount,
                amount: budgets.amount,
                name: budgets.name,
                userId: budgets.userId,
            })
            .from(budgets)
            .where(eq(budgets.userId, userId));

        return res.status(200).json({
            success: true,
            message: 'Budgets retrieved.',
            data: userBudgets,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve budgets.',
            data: { error: error.message },
        });
    }
})

// api to update a budget's name or amount or both
app.patch("/budgets/:id", authMiddleware, async (req,res)=>{
    try {
        const { id } = req.params;
        const { amount, name } = req.body;
        const userId = req.user.userId;

        if (!amount && !name) {
            return res.status(400).json({
                success: false,
                message: 'At least amount or name is required.',
                data: {},
            });
        }

        const budgetToUpdate = await db
            .select({ id: budgets.id, userId: budgets.userId, totalAmount: budgets.totalAmount, currentAmount: budgets.amount })
            .from(budgets)
            .where(and(eq(budgets.id, parseInt(id)), eq(budgets.userId, userId)))
            .limit(1);

        if (budgetToUpdate.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found or unauthorized.',
                data: {},
            });
        }

        const updateData = {};
        if (amount) {
            const newTotalAmount = parseInt(amount);
            const oldTotalAmount = budgetToUpdate[0].totalAmount;
            const currentAmount = budgetToUpdate[0].currentAmount;
            
            // Calculate the new remaining amount based on difference in total amounts
            const difference = newTotalAmount - oldTotalAmount;
            const newRemainingAmount = currentAmount + difference;
            
            updateData.totalAmount = newTotalAmount;
            updateData.amount = newRemainingAmount;
        }
        if (name) updateData.name = String(name).trim();

        const updatedBudgets = await db
            .update(budgets)
            .set(updateData)
            .where(eq(budgets.id, parseInt(id)))
            .returning({
                id: budgets.id,
                totalAmount: budgets.totalAmount,
                amount: budgets.amount,
                name: budgets.name,
                userId: budgets.userId,
            });

        return res.status(200).json({
            success: true,
            message: 'Budget updated.',
            data: updatedBudgets[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update budget.',
            data: { error: error.message },
        });
    }
})

// api to delete a budget
app.delete("/budgets/:id", authMiddleware, async (req,res)=>{
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const budgetToDelete = await db
            .select({ id: budgets.id, userId: budgets.userId })
            .from(budgets)
            .where(and(eq(budgets.id, parseInt(id)), eq(budgets.userId, userId)))
            .limit(1);

        if (budgetToDelete.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found or unauthorized.',
                data: {},
            });
        }

        const relatedExpenses = await db
            .select({ id: expenses.id })
            .from(expenses)
            .where(eq(expenses.budgetId, parseInt(id)));

        for (const expense of relatedExpenses) {
            await db.delete(transactions).where(eq(transactions.expenseId, expense.id));
        }

        await db.delete(expenses).where(eq(expenses.budgetId, parseInt(id)));
        await db.delete(budgets).where(eq(budgets.id, parseInt(id)));

        return res.status(200).json({
            success: true,
            message: 'Budget deleted.',
            data: {},
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete budget.',
            data: { error: error.message },
        });
    }
})





// expenses (requires auth middleware)

// post expense of a specific budget
app.post("/expenses", authMiddleware, async (req,res)=>{
    try {
        const { budgetId, name } = req.body;
        const userId = req.user.userId;

        if (!budgetId || !name) {
            return res.status(400).json({
                success: false,
                message: 'budgetId and name are required.',
                data: {},
            });
        }

        const budgetExists = await db
            .select({ id: budgets.id })
            .from(budgets)
            .where(and(eq(budgets.id, parseInt(budgetId)), eq(budgets.userId, userId)))
            .limit(1);

        if (budgetExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found or unauthorized.',
                data: {},
            });
        }

        const expenseExists = await db
            .select({ id: expenses.id })
            .from(expenses)
            .where(and(eq(expenses.budgetId, parseInt(budgetId)), eq(expenses.name, String(name).trim())))
            .limit(1);

        if (expenseExists.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Expense with this name already exists for this budget.',
                data: {},
            });
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

        return res.status(201).json({
            success: true,
            message: 'Expense created.',
            data: insertedExpenses[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create expense.',
            data: { error: error.message },
        });
    }
})
app.get("/expenses", authMiddleware, async (req,res)=>{
    try {
        const { budgetId } = req.query;
        const userId = req.user.userId;

        if (!budgetId) {
            return res.status(400).json({
                success: false,
                message: 'budgetId is required.',
                data: {},
            });
        }

        const budgetExists = await db
            .select({ id: budgets.id })
            .from(budgets)
            .where(and(eq(budgets.id, parseInt(budgetId)), eq(budgets.userId, userId)))
            .limit(1);

        if (budgetExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found or unauthorized.',
                data: {},
            });
        }

        const budgetExpenses = await db
            .select({
                id: expenses.id,
                name: expenses.name,
                amount: expenses.amount,
                budgetId: expenses.budgetId,
            })
            .from(expenses)
            .where(eq(expenses.budgetId, parseInt(budgetId)));

        return res.status(200).json({
            success: true,
            message: 'Expenses retrieved.',
            data: budgetExpenses,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve expenses.',
            data: { error: error.message },
        });
    }
})

// update a expense
app.patch("/expenses/:id", authMiddleware, async (req,res)=>{
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user.userId;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'name is required.',
                data: {},
            });
        }

        const expenseToUpdate = await db
            .select({ 
                id: expenses.id, 
                budgetId: expenses.budgetId 
            })
            .from(expenses)
            .where(eq(expenses.id, parseInt(id)))
            .limit(1);

        if (expenseToUpdate.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found.',
                data: {},
            });
        }

        const budgetOwner = await db
            .select({ userId: budgets.userId })
            .from(budgets)
            .where(eq(budgets.id, expenseToUpdate[0].budgetId))
            .limit(1);

        if (budgetOwner.length === 0 || budgetOwner[0].userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
                data: {},
            });
        }

        const updatedExpenses = await db
            .update(expenses)
            .set({ name: String(name).trim() })
            .where(eq(expenses.id, parseInt(id)))
            .returning({
                id: expenses.id,
                name: expenses.name,
                amount: expenses.amount,
                budgetId: expenses.budgetId,
            });

        return res.status(200).json({
            success: true,
            message: 'Expense updated.',
            data: updatedExpenses[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update expense.',
            data: { error: error.message },
        });
    }
})

// delete a expense
app.delete("/expenses/:id", authMiddleware, async (req,res)=>{
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const expenseToDelete = await db
            .select({ 
                id: expenses.id, 
                amount: expenses.amount,
                budgetId: expenses.budgetId 
            })
            .from(expenses)
            .where(eq(expenses.id, parseInt(id)))
            .limit(1);

        if (expenseToDelete.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found.',
                data: {},
            });
        }

        const budgetOwner = await db
            .select({ userId: budgets.userId, amount: budgets.amount })
            .from(budgets)
            .where(eq(budgets.id, expenseToDelete[0].budgetId))
            .limit(1);

        if (budgetOwner.length === 0 || budgetOwner[0].userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
                data: {},
            });
        }

        if (expenseToDelete[0].amount > 0) {
            await db
                .update(budgets)
                .set({ amount: budgetOwner[0].amount + expenseToDelete[0].amount })
                .where(eq(budgets.id, expenseToDelete[0].budgetId));
        }

        await db.delete(transactions).where(eq(transactions.expenseId, parseInt(id)));
        await db.delete(expenses).where(eq(expenses.id, parseInt(id)));

        return res.status(200).json({
            success: true,
            message: 'Expense deleted.',
            data: {},
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete expense.',
            data: { error: error.message },
        });
    }
})



// transactions (requires auth middleware)

app.post("/transactions", authMiddleware, async (req,res)=>{
    try {
        const { name, amount, date, expenseId } = req.body;
        const userId = req.user.userId;

        if (!name || !amount || !date || !expenseId) {
            return res.status(400).json({
                success: false,
                message: 'name, amount, date and expenseId are required.',
                data: {},
            });
        }

        const transactionAmount = parseInt(amount);
        const parsedExpenseId = parseInt(expenseId);

        if (Number.isNaN(transactionAmount) || transactionAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'amount must be a positive integer.',
                data: {},
            });
        }

        return await db.transaction(async (tx) => {
            const expenseResult = await tx
                .select({
                    id: expenses.id,
                    amount: expenses.amount,
                    budgetId: expenses.budgetId,
                })
                .from(expenses)
                .where(eq(expenses.id, parsedExpenseId))
                .limit(1);

            if (expenseResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found.',
                    data: {},
                });
            }

            const budgetResult = await tx
                .select({
                    id: budgets.id,
                    amount: budgets.amount,
                    userId: budgets.userId,
                })
                .from(budgets)
                .where(eq(budgets.id, expenseResult[0].budgetId))
                .limit(1);

            if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized.',
                    data: {},
                });
            }

            if (budgetResult[0].amount < transactionAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient budget amount.',
                    data: {},
                });
            }

            const insertedTransactions = await tx
                .insert(transactions)
                .values({
                    name: String(name).trim(),
                    amount: transactionAmount,
                    date: new Date(date),
                    expenseId: parsedExpenseId,
                })
                .returning({
                    id: transactions.id,
                    name: transactions.name,
                    amount: transactions.amount,
                    date: transactions.date,
                    expenseId: transactions.expenseId,
                });

            await tx
                .update(expenses)
                .set({ amount: expenseResult[0].amount + transactionAmount })
                .where(eq(expenses.id, parsedExpenseId));

            await tx
                .update(budgets)
                .set({ amount: budgetResult[0].amount - transactionAmount })
                .where(eq(budgets.id, budgetResult[0].id));

            return res.status(201).json({
                success: true,
                message: 'Transaction created.',
                data: insertedTransactions[0],
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create transaction.',
            data: { error: error.message },
        });
    }
})

app.get("/transactions", authMiddleware, async (req,res)=>{
    try {
        const { expenseId } = req.query;
        const userId = req.user.userId;

        if (!expenseId) {
            return res.status(400).json({
                success: false,
                message: 'expenseId is required.',
                data: {},
            });
        }

        const expenseResult = await db
            .select({
                id: expenses.id,
                budgetId: expenses.budgetId,
            })
            .from(expenses)
            .where(eq(expenses.id, parseInt(expenseId)))
            .limit(1);

        if (expenseResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found.',
                data: {},
            });
        }

        const budgetResult = await db
            .select({ userId: budgets.userId })
            .from(budgets)
            .where(eq(budgets.id, expenseResult[0].budgetId))
            .limit(1);

        if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
                data: {},
            });
        }

        const expenseTransactions = await db
            .select({
                id: transactions.id,
                name: transactions.name,
                amount: transactions.amount,
                date: transactions.date,
                expenseId: transactions.expenseId,
            })
            .from(transactions)
            .where(eq(transactions.expenseId, parseInt(expenseId)));

        return res.status(200).json({
            success: true,
            message: 'Transactions retrieved.',
            data: expenseTransactions,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve transactions.',
            data: { error: error.message },
        });
    }
})

// update transaction
app.patch("/transactions/:id", authMiddleware, async (req,res)=>{
    try {
        const { id } = req.params;
        const { name, amount, date } = req.body;
        const userId = req.user.userId;

        if (!name && !amount && !date) {
            return res.status(400).json({
                success: false,
                message: 'At least one field (name, amount, date) is required.',
                data: {},
            });
        }

        return await db.transaction(async (tx) => {
            const transactionResult = await tx
                .select({
                    id: transactions.id,
                    name: transactions.name,
                    amount: transactions.amount,
                    date: transactions.date,
                    expenseId: transactions.expenseId,
                })
                .from(transactions)
                .where(eq(transactions.id, parseInt(id)))
                .limit(1);

            if (transactionResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found.',
                    data: {},
                });
            }

            const expenseResult = await tx
                .select({
                    id: expenses.id,
                    amount: expenses.amount,
                    budgetId: expenses.budgetId,
                })
                .from(expenses)
                .where(eq(expenses.id, transactionResult[0].expenseId))
                .limit(1);

            if (expenseResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Related expense not found.',
                    data: {},
                });
            }

            const budgetResult = await tx
                .select({
                    id: budgets.id,
                    amount: budgets.amount,
                    userId: budgets.userId,
                })
                .from(budgets)
                .where(eq(budgets.id, expenseResult[0].budgetId))
                .limit(1);

            if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized.',
                    data: {},
                });
            }

            const oldAmount = transactionResult[0].amount;
            const newAmount = amount !== undefined ? parseInt(amount) : oldAmount;

            if (Number.isNaN(newAmount) || newAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'amount must be a positive integer.',
                    data: {},
                });
            }

            const delta = newAmount - oldAmount;

            if (delta > 0 && budgetResult[0].amount < delta) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient budget amount for this update.',
                    data: {},
                });
            }

            const updateData = {};
            if (name) updateData.name = String(name).trim();
            if (amount !== undefined) updateData.amount = newAmount;
            if (date) updateData.date = new Date(date);

            const updatedTransactions = await tx
                .update(transactions)
                .set(updateData)
                .where(eq(transactions.id, parseInt(id)))
                .returning({
                    id: transactions.id,
                    name: transactions.name,
                    amount: transactions.amount,
                    date: transactions.date,
                    expenseId: transactions.expenseId,
                });

            if (delta !== 0) {
                await tx
                    .update(expenses)
                    .set({ amount: expenseResult[0].amount + delta })
                    .where(eq(expenses.id, expenseResult[0].id));

                await tx
                    .update(budgets)
                    .set({ amount: budgetResult[0].amount - delta })
                    .where(eq(budgets.id, budgetResult[0].id));
            }

            return res.status(200).json({
                success: true,
                message: 'Transaction updated.',
                data: updatedTransactions[0],
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update transaction.',
            data: { error: error.message },
        });
    }
})

// delete transaction
app.delete("/transactions/:id", authMiddleware, async (req,res)=>{
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        return await db.transaction(async (tx) => {
            const transactionResult = await tx
                .select({
                    id: transactions.id,
                    amount: transactions.amount,
                    expenseId: transactions.expenseId,
                })
                .from(transactions)
                .where(eq(transactions.id, parseInt(id)))
                .limit(1);

            if (transactionResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found.',
                    data: {},
                });
            }

            const expenseResult = await tx
                .select({
                    id: expenses.id,
                    amount: expenses.amount,
                    budgetId: expenses.budgetId,
                })
                .from(expenses)
                .where(eq(expenses.id, transactionResult[0].expenseId))
                .limit(1);

            if (expenseResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Related expense not found.',
                    data: {},
                });
            }

            const budgetResult = await tx
                .select({
                    id: budgets.id,
                    amount: budgets.amount,
                    userId: budgets.userId,
                })
                .from(budgets)
                .where(eq(budgets.id, expenseResult[0].budgetId))
                .limit(1);

            if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized.',
                    data: {},
                });
            }

            await tx
                .update(expenses)
                .set({ amount: expenseResult[0].amount - transactionResult[0].amount })
                .where(eq(expenses.id, expenseResult[0].id));

            await tx
                .update(budgets)
                .set({ amount: budgetResult[0].amount + transactionResult[0].amount })
                .where(eq(budgets.id, budgetResult[0].id));

            await tx
                .delete(transactions)
                .where(eq(transactions.id, parseInt(id)));

            return res.status(200).json({
                success: true,
                message: 'Transaction deleted.',
                data: {},
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete transaction.',
            data: { error: error.message },
        });
    }
})


app.listen(3000, () => {
  console.log(`Example app listening on port ${3000}`);
});