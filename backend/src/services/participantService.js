import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getParticipants(groupId, userId) {
    // Verify user membership
    const group = await prisma.group.findFirst({
        where: {
            id: groupId,
            members: {
                some: { userId }
            }
        }
    });

    if (!group) {
        throw new AppError('Group not found', 404);
    }

    return prisma.participant.findMany({
        where: { groupId },
        orderBy: { createdAt: 'asc' }
    });
}

export async function updateParticipant(participantId, userId, data) {
    // Verify user membership in the participant's group
    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: {
            group: {
                include: {
                    members: true
                }
            }
        }
    });

    if (!participant) {
        throw new AppError('Participant not found', 404);
    }

    const isMember = participant.group.members.some(m => m.userId === userId);
    if (!isMember) {
        throw new AppError('Unauthorized', 403);
    }

    return prisma.participant.update({
        where: { id: participantId },
        data: {
            name: data.name,
            color: data.color,
            avatarUrl: data.avatarUrl
        }
    });
}

export async function deleteParticipant(participantId, userId) {
    // Verify user membership
    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: {
            group: {
                include: {
                    members: true,
                    participants: true
                }
            },
            paidExpenses: true,
            splits: true
        }
    });

    if (!participant) {
        throw new AppError('Participant not found', 404);
    }

    const isMember = participant.group.members.some(m => m.userId === userId);
    if (!isMember) {
        throw new AppError('Unauthorized', 403);
    }

    // Can't delete if they're the only participant
    if (participant.group.participants.length <= 1) {
        throw new AppError('Cannot delete the last participant', 400);
    }

    // Handle linked expenses - delete expenses where this participant is the payer
    if (participant.paidExpenses.length > 0) {
        await prisma.expense.deleteMany({
            where: {
                payerId: participantId
            }
        });
    }

    // Delete splits for this participant
    await prisma.expenseSplit.deleteMany({
        where: { participantId }
    });

    // Delete the participant
    await prisma.participant.delete({
        where: { id: participantId }
    });

    return { success: true };
}
