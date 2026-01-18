import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as expenseService from '../services/expenseService.js';

const router = Router();

router.use(authenticate);

// Get expenses for a group (with filters)
router.get('/group/:groupId', async (req, res, next) => {
    try {
        const filters = {
            search: req.query.search,
            participant: req.query.participant,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            amountMin: req.query.amountMin,
            amountMax: req.query.amountMax
        };

        const expenses = await expenseService.getExpenses(
            req.params.groupId,
            req.user.userId,
            filters
        );
        res.json(expenses);
    } catch (error) {
        next(error);
    }
});

// Create expense
router.post('/group/:groupId', async (req, res, next) => {
    try {
        const {
            amount,
            description,
            payerId,
            splitMode,
            participantIds,
            percentages,
            amounts,
            category,
            expenseDate
        } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        if (!payerId) {
            return res.status(400).json({ error: 'Payer is required' });
        }

        const expense = await expenseService.createExpense(
            req.params.groupId,
            req.user.userId,
            {
                amount: parseFloat(amount),
                description,
                payerId,
                splitMode,
                participantIds,
                percentages,
                amounts,
                category,
                expenseDate
            }
        );
        res.status(201).json(expense);
    } catch (error) {
        next(error);
    }
});

// Get expense by ID
router.get('/:id', async (req, res, next) => {
    try {
        const expense = await expenseService.getExpenseById(
            req.params.id,
            req.user.userId
        );
        res.json(expense);
    } catch (error) {
        next(error);
    }
});

// Update expense
router.put('/:id', async (req, res, next) => {
    try {
        const expense = await expenseService.updateExpense(
            req.params.id,
            req.user.userId,
            req.body
        );
        res.json(expense);
    } catch (error) {
        next(error);
    }
});

// Delete expense
router.delete('/:id', async (req, res, next) => {
    try {
        await expenseService.deleteExpense(req.params.id, req.user.userId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
