import express from 'express';
import { authenticate } from '../middleware/auth.js';
import mintSenseService from '../services/mintSenseService.js';
import prisma from '../config/database.js';

const router = express.Router();

/**
 * POST /api/ai/parse-expense
 * Parse natural language expense input
 */
router.post('/parse-expense', authenticate, async (req, res, next) => {
    try {
        const { text, groupId } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Get group participants if groupId provided
        let participants = [];
        if (groupId) {
            const group = await prisma.group.findUnique({
                where: { id: groupId },
                include: { participants: true }
            });
            participants = group?.participants || [];
        }

        const result = await mintSenseService.parseExpenseFromText(text, participants);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ai/categorize
 * Auto-categorize an expense
 */
router.post('/categorize', authenticate, async (req, res, next) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const category = await mintSenseService.categorizeExpense(description);
        res.json({ category });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/ai/group-summary/:groupId
 * Generate AI summary for a group
 */
router.get('/group-summary/:groupId', authenticate, async (req, res, next) => {
    try {
        const { groupId } = req.params;

        // Fetch complete group data
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                participants: true,
                expenses: {
                    include: {
                        payer: true,
                        splits: {
                            include: {
                                participant: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Calculate balances
        const balances = group.participants.map(participant => {
            const totalPaid = group.expenses
                .filter(e => e.payerId === participant.id)
                .reduce((sum, e) => sum + e.amount, 0);

            const totalOwed = group.expenses
                .flatMap(e => e.splits)
                .filter(s => s.participantId === participant.id)
                .reduce((sum, s) => sum + s.amount, 0);

            return {
                participant,
                balance: totalPaid - totalOwed
            };
        });

        const summary = await mintSenseService.generateGroupSummary({
            name: group.name,
            expenses: group.expenses,
            participants: group.participants,
            balances
        });

        res.json({ summary });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ai/explain-settlements
 * Get AI explanation for settlement suggestions
 */
router.post('/explain-settlements', authenticate, async (req, res, next) => {
    try {
        const { settlements, balances } = req.body;

        if (!settlements || !Array.isArray(settlements)) {
            return res.status(400).json({ error: 'Settlements array is required' });
        }

        const explanation = await mintSenseService.explainSettlements(settlements, balances);
        res.json({ explanation });
    } catch (error) {
        next(error);
    }
});

export default router;
