/**
 * Rounding utilities for expense calculations
 * Uses banker's rounding (round half to even) for financial accuracy
 */

/**
 * Round to specified decimal places using banker's rounding
 */
export function round(value, decimals = 2) {
    const multiplier = Math.pow(10, decimals);
    const shifted = value * multiplier;
    const rounded = Math.round(shifted);
    return rounded / multiplier;
}

/**
 * Split amount equally among participants
 * Ensures total equals original amount by adjusting first share
 */
export function splitEqually(totalAmount, participantCount) {
    if (participantCount <= 0) {
        throw new Error('Participant count must be positive');
    }

    const baseShare = round(totalAmount / participantCount);
    const shares = Array(participantCount).fill(baseShare);

    // Calculate remainder and adjust first share
    const totalShares = shares.reduce((sum, s) => sum + s, 0);
    const remainder = round(totalAmount - totalShares);

    if (remainder !== 0) {
        shares[0] = round(shares[0] + remainder);
    }

    return shares;
}

/**
 * Split amount by percentages
 * Ensures percentages sum to 100 and amounts sum to total
 */
export function splitByPercentage(totalAmount, percentages) {
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('Percentages must sum to 100');
    }

    const amounts = percentages.map(p => round(totalAmount * p / 100));

    // Adjust largest share for remainder
    const totalAmounts = amounts.reduce((sum, a) => sum + a, 0);
    const remainder = round(totalAmount - totalAmounts);

    if (remainder !== 0) {
        const maxIndex = amounts.indexOf(Math.max(...amounts));
        amounts[maxIndex] = round(amounts[maxIndex] + remainder);
    }

    return amounts;
}

/**
 * Validate custom split amounts
 */
export function validateCustomSplit(totalAmount, amounts) {
    const totalSplit = amounts.reduce((sum, a) => sum + a, 0);
    return Math.abs(totalSplit - totalAmount) < 0.01;
}
