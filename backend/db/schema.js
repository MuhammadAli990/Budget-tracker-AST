import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: text("email").notNull(),
	name: text("name").notNull(),
	password: text("password").notNull(),
});

export const budgets = pgTable("budgets", {
	id: serial("id").primaryKey(),
	amount: integer("amount").notNull(),
	name: text("name").notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
});

export const expenses = pgTable("expenses", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
    amount: integer("amount").default(0),
	budgetId: integer("budget_id").notNull().references(() => budgets.id),
});

export const transactions = pgTable("transactions", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	amount: integer("amount").notNull(),
	date: timestamp("date").notNull(),
	expenseId: integer("expense_id").notNull().references(() => expenses.id),
});

export const usersRelations = relations(users, ({ many }) => ({
	budgets: many(budgets),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
	user: one(users, {
		fields: [budgets.userId],
		references: [users.id],
	}),
	expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
	budget: one(budgets, {
		fields: [expenses.budgetId],
		references: [budgets.id],
	}),
	transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
	expense: one(expenses, {
		fields: [transactions.expenseId],
		references: [expenses.id],
	}),
}));

