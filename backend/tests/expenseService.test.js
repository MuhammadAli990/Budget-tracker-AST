import { jest } from '@jest/globals';

describe('expenseService', () => {
  test('createExpense inserts when budget exists and name unique', async () => {
    const { createExpense } = await import('../services/expenseService.js');

    const budgetExists = [{ id: 10 }];
    const limitBud = jest.fn().mockResolvedValue(budgetExists);
    const whereBud = jest.fn(() => ({ limit: limitBud }));
    const fromBud = jest.fn(() => ({ where: whereBud }));
    const selectBud = jest.fn(() => ({ from: fromBud }));

    const limitExp = jest.fn().mockResolvedValue([]);
    const whereExp = jest.fn(() => ({ limit: limitExp }));
    const fromExp = jest.fn(() => ({ where: whereExp }));
    const selectExp = jest.fn(() => ({ from: fromExp }));

    const returning = jest.fn().mockResolvedValue([{ id: 5, name: 'E', amount: 0, budgetId: 10 }]);
    const values = jest.fn(() => ({ returning }));
    const insert = jest.fn(() => ({ values }));

    const mockDb = {
      select: jest.fn()
        .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: limitBud }) }) }))
        .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: limitExp }) }) })),
      insert,
    };

    const res = await createExpense(mockDb, 1, 10, ' New Expense ');
    expect(insert).toHaveBeenCalled();
    expect(res).toMatchObject({ id: 5, name: 'E', budgetId: 10 });
  });

  test('createExpense throws 409 when expense name exists', async () => {
    const { createExpense } = await import('../services/expenseService.js');

    const budgetExists = [{ id: 10 }];
    const existingExpense = [{ id: 7 }];

    const mockDb = {
      select: jest.fn()
        .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(budgetExists) }) }) }))
        .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(existingExpense) }) }) })),
    };

    await expect(createExpense(mockDb, 1, 10, 'Dup')).rejects.toMatchObject({ statusCode: 409 });
  });

  test('updateExpense updates when authorized', async () => {
    const { updateExpense } = await import('../services/expenseService.js');

    const expenseToUpdate = [{ id: 2, budgetId: 20 }];
    const budgetResult = [{ userId: 3 }];

    const mockSelect = jest.fn()
      .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(expenseToUpdate) }) }) }))
      .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(budgetResult) }) }) }));

    const returning = jest.fn().mockResolvedValue([{ id: 2, name: 'New', amount: 0, budgetId: 20 }]);
    const set = jest.fn(() => ({ where: jest.fn(() => ({ returning })) }));
    const update = jest.fn(() => ({ set }));

    const mockDb = { select: mockSelect, update };

    const res = await updateExpense(mockDb, 3, 2, ' New ');
    expect(update).toHaveBeenCalled();
    expect(res).toMatchObject({ id: 2, name: 'New' });
  });

  test('createExpense throws 404 when budget not found', async () => {
    const { createExpense } = await import('../services/expenseService.js');

    const budgetNotFound = [];

    const mockDb = {
      select: jest.fn()
        .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(budgetNotFound) }) }) })),
    };

    await expect(createExpense(mockDb, 1, 999, 'E')).rejects.toMatchObject({ statusCode: 404 });
  });

  test('updateExpense throws 403 when unauthorized', async () => {
    const { updateExpense } = await import('../services/expenseService.js');

    const expenseToUpdate = [{ id: 2, budgetId: 20 }];
    const budgetResult = [{ userId: 999 }]; // Different user

    const mockSelect = jest.fn()
      .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(expenseToUpdate) }) }) }))
      .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(budgetResult) }) }) }));

    const mockDb = { select: mockSelect };

    await expect(updateExpense(mockDb, 3, 2, 'New')).rejects.toMatchObject({ statusCode: 403 });
  });

  test('deleteExpense restores budget and deletes relations when amount>0', async () => {
    const { deleteExpense } = await import('../services/expenseService.js');

    const expenseToDelete = [{ id: 9, amount: 30, budgetId: 40 }];
    const budgetOwner = [{ userId: 7, amount: 70 }];

    const select = jest.fn()
      .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(expenseToDelete) }) }) }))
      .mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: jest.fn().mockResolvedValue(budgetOwner) }) }) }));

    const update = jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn() })) }));
    const del = jest.fn(() => ({ where: jest.fn() }));

    const mockDb = { select, update, delete: jest.fn(() => ({ where: jest.fn() })) };

    // spy on update and delete calls
    mockDb.update = update;
    mockDb.delete = del;

    await deleteExpense(mockDb, 7, 9);

    expect(update).toHaveBeenCalled();
    expect(del).toHaveBeenCalled();
  });
});
