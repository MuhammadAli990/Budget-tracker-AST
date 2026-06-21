export const config = {
    baseUrl: 'http://localhost:5173', // Frontend URL
    apiUrl: 'http://localhost:3000', // Backend URL
    browser: 'chrome',
    timeout: 10000,
    credentials: {
        email: process.env.TEST_EMAIL || 'testuser@example.com',
        password: 'password123'
    }
};
