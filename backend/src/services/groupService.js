import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getGroupSummary, calculateSettlements } from './balanceEngine.js';

const MAX_PARTICIPANTS = 4; // Including owner

export async function createGroup(ownerId, name, currency = 'INR') {
    const group = await prisma.group.create({
        data: {
            name,
            currency,
            ownerId,
            members: {
                create: {
                    userId: ownerId,
                    role: 'owner'
                }
            }
        },
        include: {
            owner: {
                select: { id: true, name: true, email: true }
            }
        }
    });

    // Create the owner as a participant
    const user = await prisma.user.findUnique({
        where: { id: ownerId }
    });

    await prisma.participant.create({
        data: {
            groupId: group.id,
            name: user.name,
            isRegisteredUser: true,
            linkedUserId: ownerId,
            color: '#6366f1'
        }
    });

    return group;
}

export async function getGroups(userId) {
    const groups = await prisma.group.findMany({
        where: {
            members: {
                some: { userId }
            }
        },
        include: {
            owner: {
                select: { id: true, name: true }
            },
            participants: true,
            _count: {
                select: { expenses: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Add summary info for each group
    const groupsWithSummary = await Promise.all(
        groups.map(async (group) => {
            const summary = await getGroupSummary(group.id);
            return {
                ...group,
                totalSpent: summary.totalSpent,
                expenseCount: summary.expenseCount
            };
        })
    );

    return groupsWithSummary;
}

export async function getGroupById(groupId, userId) {
    const group = await prisma.group.findFirst({
        where: {
            id: groupId,
            members: {
                some: { userId }
            }
        },
        include: {
            owner: {
                select: { id: true, name: true, email: true }
            },
            participants: {
                orderBy: { createdAt: 'asc' }
            },
            expenses: {
                include: {
                    payer: true,
                    splits: {
                        include: { participant: true }
                    }
                },
                orderBy: { expenseDate: 'desc' }
            }
        }
    });

    if (!group) {
        throw new AppError('Group not found', 404);
    }

    const summary = await getGroupSummary(groupId);
    const settlements = await calculateSettlements(groupId);

    return {
        ...group,
        summary,
        settlements
    };
}

export async function updateGroup(groupId, userId, data) {
    // Verify ownership
    const group = await prisma.group.findFirst({
        where: {
            id: groupId,
            ownerId: userId
        }
    });

    if (!group) {
        throw new AppError('Group not found or unauthorized', 404);
    }

    return prisma.group.update({
        where: { id: groupId },
        data: {
            name: data.name,
            currency: data.currency
        }
    });
}

export async function deleteGroup(groupId, userId) {
    // Verify ownership
    const group = await prisma.group.findFirst({
        where: {
            id: groupId,
            ownerId: userId
        }
    });

    if (!group) {
        throw new AppError('Group not found or unauthorized', 404);
    }

    // Cascade delete is handled by Prisma schema
    await prisma.group.delete({
        where: { id: groupId }
    });

    return { success: true };
}

export async function addParticipant(groupId, userId, participantData) {
    // Verify membership
    const group = await prisma.group.findFirst({
        where: {
            id: groupId,
            members: {
                some: { userId }
            }
        },
        include: {
            participants: true
        }
    });

    if (!group) {
        throw new AppError('Group not found', 404);
    }

    if (group.participants.length >= MAX_PARTICIPANTS) {
        throw new AppError(`Maximum ${MAX_PARTICIPANTS} participants allowed`, 400);
    }

    return prisma.participant.create({
        data: {
            groupId,
            name: participantData.name,
            color: participantData.color || getRandomColor(),
            avatarUrl: participantData.avatarUrl
        }
    });
}

function getRandomColor() {
    const colors = [
        '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
        '#f43f5e', '#ef4444', '#f97316', '#eab308',
        '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
