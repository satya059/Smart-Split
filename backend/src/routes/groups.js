import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as groupService from '../services/groupService.js';
import { getGroupSummary, calculateSettlements } from '../services/balanceEngine.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List user's groups
router.get('/', async (req, res, next) => {
    try {
        const groups = await groupService.getGroups(req.user.userId);
        res.json(groups);
    } catch (error) {
        next(error);
    }
});

// Create group
router.post('/', async (req, res, next) => {
    try {
        const { name, currency } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const group = await groupService.createGroup(req.user.userId, name, currency);
        res.status(201).json(group);
    } catch (error) {
        next(error);
    }
});

// Get group details
router.get('/:id', async (req, res, next) => {
    try {
        const group = await groupService.getGroupById(req.params.id, req.user.userId);
        res.json(group);
    } catch (error) {
        next(error);
    }
});

// Update group
router.put('/:id', async (req, res, next) => {
    try {
        const group = await groupService.updateGroup(
            req.params.id,
            req.user.userId,
            req.body
        );
        res.json(group);
    } catch (error) {
        next(error);
    }
});

// Delete group
router.delete('/:id', async (req, res, next) => {
    try {
        await groupService.deleteGroup(req.params.id, req.user.userId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// Get group summary
router.get('/:id/summary', async (req, res, next) => {
    try {
        const summary = await getGroupSummary(req.params.id);
        res.json(summary);
    } catch (error) {
        next(error);
    }
});

// Get settlement suggestions
router.get('/:id/settlements', async (req, res, next) => {
    try {
        const settlements = await calculateSettlements(req.params.id);
        res.json(settlements);
    } catch (error) {
        next(error);
    }
});

// Add participant to group
router.post('/:id/participants', async (req, res, next) => {
    try {
        const { name, color, avatarUrl } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Participant name is required' });
        }

        const participant = await groupService.addParticipant(
            req.params.id,
            req.user.userId,
            { name, color, avatarUrl }
        );
        res.status(201).json(participant);
    } catch (error) {
        next(error);
    }
});

export default router;
