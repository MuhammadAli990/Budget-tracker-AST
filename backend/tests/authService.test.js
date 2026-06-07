import { jest } from '@jest/globals';

describe('authService', () => {
  test('loginUser returns token and user when credentials are valid', async () => {
    const { loginUser } = await import('../services/authService.js');

    const mockUser = { id: 1, email: 'test@example.com', name: 'Tester', password: 'secret' };

    const limit = jest.fn().mockResolvedValue([mockUser]);
    const where = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ where }));
    const select = jest.fn(() => ({ from }));

    const mockDb = { select };

    const result = await loginUser(mockDb, ' TEST@Example.com ', 'secret');

    expect(select).toHaveBeenCalled();
    expect(where).toHaveBeenCalled();
    expect(limit).toHaveBeenCalled();
    expect(result).toHaveProperty('token');
    expect(result.user).toMatchObject({ id: 1, email: 'test@example.com', name: 'Tester' });
  });

  test('loginUser throws 401 for invalid credentials', async () => {
    const { loginUser } = await import('../services/authService.js');

    const limit = jest.fn().mockResolvedValue([]);
    const where = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ where }));
    const select = jest.fn(() => ({ from }));

    const mockDb = { select };

    await expect(loginUser(mockDb, 'no@one.com', 'bad')).rejects.toMatchObject({ statusCode: 401 });
  });

  test('registerUser throws 409 when email already exists', async () => {
    const { registerUser } = await import('../services/authService.js');

    const existing = { id: 2 };
    const limit = jest.fn().mockResolvedValue([existing]);
    const where = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ where }));
    const select = jest.fn(() => ({ from }));

    const mockDb = {
      select,
      insert: jest.fn(),
    };

    await expect(registerUser(mockDb, 'test@example.com', 'p', 'Name')).rejects.toMatchObject({ statusCode: 409 });
  });

  test('loginUser rejects empty email', async () => {
    const { loginUser } = await import('../services/authService.js');

    const limit = jest.fn().mockResolvedValue([]);
    const where = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ where }));
    const select = jest.fn(() => ({ from }));

    const mockDb = { select };

    // Empty email should not match any user
    await expect(loginUser(mockDb, '  ', 'secret')).rejects.toMatchObject({ statusCode: 401 });
  });

  test('registerUser inserts and returns created user when new', async () => {
    const { registerUser } = await import('../services/authService.js');

    const limit = jest.fn().mockResolvedValue([]);
    const where = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ where }));
    const select = jest.fn(() => ({ from }));

    const returning = jest.fn().mockResolvedValue([{ id: 3, email: 'a@b.com', name: 'A' }]);
    const values = jest.fn(() => ({ returning }));
    const insert = jest.fn(() => ({ values }));

    const mockDb = { select, insert };

    const res = await registerUser(mockDb, 'A@B.COM', 'pw', ' A ');
    expect(insert).toHaveBeenCalled();
    expect(res).toMatchObject({ id: 3, email: 'a@b.com', name: 'A' });
  });
});
