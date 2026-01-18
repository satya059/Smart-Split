import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { createSplits } from './balanceEngine.js';

export async function getExpenses(groupId, userId, filters = {}) {
    // Verify membership
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

    // Build query filters
    const where = { groupId };

    if (filters.search) {
        where.description = {
            contains: filters.search
        };
    }

    if (filters.participant) {
        where.splits = {
            some: { participantId: filters.participant }
        };
    }

    if (filters.dateFrom || filters.dateTo) {
        where.expenseDate = {};
        if (filters.dateFrom) {
            where.expenseDate.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
            where.expenseDate.lte = new Date(filters.dateTo);
        }
    }

    if (filters.amountMin || filters.amountMax) {
        where.amount = {};
        if (filters.amountMin) {
            where.amount.gte = parseFloat(filters.amountMin);
        }
        if (filters.amountMax) {
            where.amount.lte = parseFloat(filters.amountMax);
        }
    }

    return prisma.expense.findMany({
        where,
        include: {
            payer: true,
            splits: {
                include: { participant: true }
            }
        },
        orderBy: { expenseDate: 'desc' }
    });
}

export async function createExpense(groupId, userId, expenseData) {
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

    // Validate payer
    const payer = group.participants.find(p => p.id === expenseData.payerId);
    if (!payer) {
        throw new AppError('Invalid payer', 400);
    }

    // Get participants involved
    let involvedParticipants;
    if (expenseData.participantIds && expenseData.participantIds.length > 0) {
        involvedParticipants = group.participants.filter(
            p => expenseData.participantIds.includes(p.id)
        );
    } else {
        // Default to all participants
        involvedParticipants = group.participants;
    }

    if (involvedParticipants.length === 0) {
        throw new AppError('At least one participant must be involved', 400);
    }

    // Create splits based on mode
    const splits = createSplits(
        expenseData.amount,
        expenseData.splitMode || 'equal',
        involvedParticipants,
        {
            percentages: expenseData.percentages,
            amounts: expenseData.amounts
        }
    );

    // Create expense with splits
    return prisma.expense.create({
        data: {
            groupId,
            payerId: expenseData.payerId,
            amount: expenseData.amount,
            description: expenseData.description,
            category: expenseData.category || 'general',
            expenseDate: expenseData.expenseDate ? new Date(expenseData.expenseDate) : new Date(),
            splitMode: expenseData.splitMode || 'equal',
            splits: {
                create: splits
            }
        },
        include: {
            payer: true,
            splits: {
                include: { participant: true }
            }
        }
    });
}

export async function getExpenseById(expenseId, userId) {
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
            payer: true,
            splits: {
                include: { participant: true }
            },
            group: {
                include: {
                    members: true
                }
            }
        }
    });

    if (!expense) {
        throw new AppError('Expense not found', 404);
    }

    const isMember = expense.group.members.some(m => m.userId === userId);
    if (!isMember) {
        throw new AppError('Unauthorized', 403);
    }

    return expense;
}

export async function updateExpense(expenseId, userId, expenseData) {
    const expense = await getExpenseById(expenseId, userId);

    // Get group participants
    const group = await prisma.group.findUnique({
        where: { id: expense.groupId },
        include: { participants: true }
    });

    // Get involved participants
    let involvedParticipants;
    if (expenseData.participantIds && expenseData.participantIds.length > 0) {
        involvedParticipants = group.participants.filter(
            p => expenseData.participantIds.includes(p.id)
        );
    } else {
        involvedParticipants = group.participants;
    }

    // Create new splits
    const newSplitMode = expenseData.splitMode || expense.splitMode;
    const newAmount = expenseData.amount || expense.amount;

    const splits = createSplits(
        newAmount,
        newSplitMode,
        involvedParticipants,
        {
            percentages: expenseData.percentages,
            amounts: expenseData.amounts
        }
    );

    // Delete old splits and create new ones
    await prisma.expenseSplit.deleteMany({
        where: { expenseId }
    });

    return prisma.expense.update({
        where: { id: expenseId },
        data: {
            payerId: expenseData.payerId || expense.payerId,
            amount: newAmount,
            description: expenseData.description || expense.description,
            category: expenseData.category || expense.category,
            expenseDate: expenseData.expenseDate ? new Date(expenseData.expenseDate) : expense.expenseDate,
            splitMode: newSplitMode,
            splits: {
                create: splits
            }
        },
        include: {
            payer: true,
            splits: {
                include: { participant: true }
            }
        }
    });
}

export async function deleteExpense(expenseId, userId) {
    await getExpenseById(expenseId, userId); // Verify access

    // Cascade delete handled by Prisma
    await prisma.expense.delete({
        where: { id: expenseId }
    });

    return { success: true };
}
