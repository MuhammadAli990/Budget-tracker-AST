import { sendSuccess, sendError } from '../utils/response.js';
import { registerUser, loginUser } from '../services/authService.js';

export const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return sendError(res, 400, 'email, password and name are required.');
        }

        const user = await registerUser(req.db, email, password, name);
        return sendSuccess(res, 201, 'User registered.', user);
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, 'email and password are required.');
        }

        const result = await loginUser(req.db, email, password);
        
        return res
            .cookie('token', result.token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            .status(200)
            .json({
                success: true,
                message: 'Login successful.',
                data: { user: result.user },
            });
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};
