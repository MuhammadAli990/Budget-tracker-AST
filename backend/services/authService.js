import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { users } from '../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export const registerUser = async (db, email, password, name) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedPassword = String(password);

    // Check if user already exists
    const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

    if (existingUser.length > 0) {
        throw {
            statusCode: 409,
            message: 'Email already registered.',
            data: {},
        };
    }

    // Create new user
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

    return insertedUsers[0];
};

export const loginUser = async (db, email, password) => {
    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user
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

    // Validate credentials
    if (foundUsers.length === 0 || foundUsers[0].password !== String(password)) {
        throw {
            statusCode: 401,
            message: 'Invalid email or password.',
            data: {},
        };
    }

    const user = foundUsers[0];

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' },
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
    };
};
