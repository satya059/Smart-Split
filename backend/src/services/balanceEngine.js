import prisma from '../config/database.js';
import { round, splitEqually, splitByPercentage } from '../utils/rounding.js';

/**
 * Balance Engine - Core calculation logic for SplitMint
 */

/**
 * Calculate net balances for all participants in a group
 * Net Balance = Total Paid - Total Owed
 */
export async function calculateGroupBalances(groupId) {
    const participants = await prisma.participant.findMany({
        where: { groupId },
        include: {
            paidExpenses: true,
            splits: {
                include: { expense: true }
            }
        }
    });

    const balances = participants.map(participant => {
        // Total paid by this participant
        const totalPaid = participant.paidExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
        );

        // Total owed by this participant (sum of their splits)
        const totalOwed = participant.splits.reduce(
            (sum, split) => sum + split.amount,
            0
        );

        const netBalance = round(totalPaid - totalOwed);

        return {
            participantId: participant.id,
            name: participant.name,
            color: participant.color,
            totalPaid: round(totalPaid),
            totalOwed: round(totalOwed),
            netBalance
        };
    });

    return balances;
}

/**
 * Calculate who owes whom
 * Returns a list of debts from one participant to another
 */
export async function calculateDebts(groupId) {
    const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
            payer: true,
            splits: {
                include: { participant: true }
            }
        }
    });

    // Map to track debts: { fromId_toId: amount }
    const debtMap = new Map();

    for (const expense of expenses) {
        const payerId = expense.payerId;

        for (const split of expense.splits) {
            if (split.participantId !== payerId) {
                const key = `${split.participantId}_${payerId}`;
                const reverseKey = `${payerId}_${split.participantId}`;

                if (debtMap.has(reverseKey)) {
                    // Reduce the reverse debt
                    const current = debtMap.get(reverseKey);
                    const newAmount = current - split.amount;

                    if (newAmount > 0.01) {
                        debtMap.set(reverseKey, newAmount);
                    } else if (newAmount < -0.01) {
                        debtMap.delete(reverseKey);
                        debtMap.set(key, Math.abs(newAmount));
                    } else {
                        debtMap.delete(reverseKey);
                    }
                } else {
                    const current = debtMap.get(key) || 0;
                    debtMap.set(key, current + split.amount);
                }
            }
        }
    }

    // Convert to array of debt objects
    const debts = [];
    const participants = await prisma.participant.findMany({
        where: { groupId }
    });
    const participantMap = new Map(participants.map(p => [p.id, p]));

    for (const [key, amount] of debtMap) {
        if (amount > 0.01) {
            const [fromId, toId] = key.split('_');
            debts.push({
                from: participantMap.get(fromId),
                to: participantMap.get(toId),
                amount: round(amount)
            });
        }
    }

    return debts;
}

/**
 * Calculate minimal settlement suggestions using greedy algorithm
 */
export async function calculateSettlements(groupId) {
    const balances = await calculateGroupBalances(groupId);

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = balances
        .filter(b => b.netBalance > 0.01)
        .map(b => ({ ...b, remaining: b.netBalance }))
        .sort((a, b) => b.remaining - a.remaining);

    const debtors = balances
        .filter(b => b.netBalance < -0.01)
        .map(b => ({ ...b, remaining: Math.abs(b.netBalance) }))
        .sort((a, b) => b.remaining - a.remaining);

    const settlements = [];

    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];

        const amount = Math.min(creditor.remaining, debtor.remaining);

        if (amount > 0.01) {
            settlements.push({
                from: {
                    id: debtor.participantId,
                    name: debtor.name,
                    color: debtor.color
                },
                to: {
                    id: creditor.participantId,
                    name: creditor.name,
                    color: creditor.color
                },
                amount: round(amount)
            });
        }

        creditor.remaining = round(creditor.remaining - amount);
        debtor.remaining = round(debtor.remaining - amount);

        if (creditor.remaining <= 0.01) i++;
        if (debtor.remaining <= 0.01) j++;
    }

    return settlements;
}

/**
 * Get group summary statistics
 */
export async function getGroupSummary(groupId) {
    const expenses = await prisma.expense.findMany({
        where: { groupId }
    });

    const balances = await calculateGroupBalances(groupId);
    const settlements = await calculateSettlements(groupId);

    const totalSpent = round(expenses.reduce((sum, e) => sum + e.amount, 0));
    const totalOwed = round(
        balances.filter(b => b.netBalance < 0).reduce((sum, b) => sum + Math.abs(b.netBalance), 0)
    );

    return {
        totalSpent,
        totalOwed,
        expenseCount: expenses.length,
        participantCount: balances.length,
        balances,
        settlements
    };
}

/**
 * Create expense splits based on split mode
 */
export function createSplits(amount, splitMode, participants, customData = {}) {
    const participantCount = participants.length;

    switch (splitMode) {
        case 'equal': {
            const shares = splitEqually(amount, participantCount);
            return participants.map((p, i) => ({
                participantId: p.id,
                amount: shares[i],
                percentage: round(100 / participantCount)
            }));
        }

        case 'percentage': {
            const { percentages } = customData;
            if (!percentages || percentages.length !== participantCount) {
                throw new Error('Percentages must be provided for each participant');
            }
            const shares = splitByPercentage(amount, percentages);
            return participants.map((p, i) => ({
                participantId: p.id,
                amount: shares[i],
                percentage: percentages[i]
            }));
        }

        case 'custom': {
            const { amounts } = customData;
            if (!amounts || amounts.length !== participantCount) {
                throw new Error('Amounts must be provided for each participant');
            }
            const total = amounts.reduce((sum, a) => sum + a, 0);
            if (Math.abs(total - amount) > 0.01) {
                throw new Error('Custom amounts must sum to total expense amount');
            }
            return participants.map((p, i) => ({
                participantId: p.id,
                amount: amounts[i],
                percentage: round((amounts[i] / amount) * 100)
            }));
        }

        default:
            throw new Error(`Unknown split mode: ${splitMode}`);
    }
}
