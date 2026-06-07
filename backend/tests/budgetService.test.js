import { jest } from '@jest/globals';

describe('budgetService - createBudget', () => {
  test('parses amount and returns inserted budget', async () => {
    const { createBudget, getBudgetById, updateBudget } = await import('../services/budgetService.js');

    const mockInserted = [{ id: 1, totalAmount: 100, amount: 100, name: 'My Budget', userId: 2 }];

    const returning = jest.fn().mockResolvedValue(mockInserted);
    const values = jest.fn(() => ({ returning }));
    const insert = jest.fn(() => ({ values }));

    const mockDb = { insert };

    const res = await createBudget(mockDb, 2, '100', ' My Budget ');

    expect(insert).toHaveBeenCalled();
    expect(res).toEqual(mockInserted[0]);
  });
});

describe('budgetService - validation', () => {
  test('createBudget rejects negative amount', async () => {
    const { createBudget } = await import('../services/budgetService.js');

    const mockDb = {
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([{ id: 1, totalAmount: -100, amount: -100, name: 'Bad', userId: 1 }])
        }))
      }))
    };

    // Should throw but currently doesn't - test will fail due to missing validation
    await expect(createBudget(mockDb, 1, '-50', 'Negative')).rejects.toMatchObject({ statusCode: 400 });
  });

  test('updateBudget rejects negative amount', async () => {
    const { updateBudget } = await import('../services/budgetService.js');

    const existingBudget = [{ id: 5, totalAmount: 100, amount: 50, name: 'X', userId: 2 }];

    const limit1 = jest.fn().mockResolvedValue(existingBudget);
    const where1 = jest.fn(() => ({ limit: limit1 }));
    const from1 = jest.fn(() => ({ where: where1 }));
    const select = jest.fn(() => ({ from: from1 }));

    const returning = jest.fn().mockResolvedValue([{ id: 5, totalAmount: -200, amount: -250, name: 'X', userId: 2 }]);
    const set = jest.fn(() => ({ where: jest.fn(() => ({ returning })) }));
    const update = jest.fn(() => ({ set }));

    const mockDb = { select, update };

    // Should throw but currently doesn't - test will fail due to missing validation
    await expect(updateBudget(mockDb, 5, 2, { amount: '-200' })).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('budgetService - updateBudget', () => {
  test('throws 404 when budget not found', async () => {
    const { updateBudget } = await import('../services/budgetService.js');

    // getBudgetById should return empty via select chain
    const limit = jest.fn().mockResolvedValue([]);
    const where = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ where }));
    const select = jest.fn(() => ({ from }));

    const mockDb = { select };

    await expect(updateBudget(mockDb, 1, 2, { amount: '200' })).rejects.toMatchObject({ statusCode: 404 });
  });

  test('updates amounts correctly when amount changes', async () => {
    const { updateBudget } = await import('../services/budgetService.js');

    const existingBudget = [{ id: 5, totalAmount: 100, amount: 50, name: 'X', userId: 2 }];

    const limit1 = jest.fn().mockResolvedValue(existingBudget);
    const where1 = jest.fn(() => ({ limit: limit1 }));
    const from1 = jest.fn(() => ({ where: where1 }));
    const select = jest.fn(() => ({ from: from1 }));

    const returning = jest.fn().mockResolvedValue([{ id: 5, totalAmount: 200, amount: 150, name: 'X', userId: 2 }]);
    const set = jest.fn(() => ({ where: jest.fn(() => ({ returning })) }));
    const update = jest.fn(() => ({ set }));

    const mockDb = { select, update };

    const res = await updateBudget(mockDb, 5, 2, { amount: '200' });
    expect(update).toHaveBeenCalled();
    expect(res).toMatchObject({ totalAmount: 200, amount: 150 });
  });
});
