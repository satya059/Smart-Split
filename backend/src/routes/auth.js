import { Router } from 'express';
import * as authService from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const result = await authService.register(email, password, name);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await authService.getCurrentUser(req.user.userId);
        res.json(user);
    } catch (error) {
        next(error);
    }
});

// Logout (client-side token removal, but we can add endpoint for consistency)
router.post('/logout', authenticate, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
