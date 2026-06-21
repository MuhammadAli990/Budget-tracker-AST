import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from './db/schema.js';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

const TEST_USERS = [
    { email: 'testuser@example.com', name: 'Test User',  password: 'password123' },
    { email: 'edgeuser@example.com', name: 'Edge User',  password: 'password123' },
];

async function seed() {
    for (const u of TEST_USERS) {
        const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, u.email))
            .limit(1);

        if (existing.length === 0) {
            await db.insert(users).values(u);
            console.log(`[seed] Inserted: ${u.email}`);
        } else {
            console.log(`[seed] Already exists: ${u.email}`);
        }
    }
    console.log('[seed] Done.');
    process.exit(0);
}

seed().catch(err => {
    console.error('[seed] Error:', err);
    process.exit(1);
});
