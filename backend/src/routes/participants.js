import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as participantService from '../services/participantService.js';

const router = Router();

router.use(authenticate);

// Update participant
router.put('/:id', async (req, res, next) => {
    try {
        const participant = await participantService.updateParticipant(
            req.params.id,
            req.user.userId,
            req.body
        );
        res.json(participant);
    } catch (error) {
        next(error);
    }
});

// Delete participant
router.delete('/:id', async (req, res, next) => {
    try {
        await participantService.deleteParticipant(req.params.id, req.user.userId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
