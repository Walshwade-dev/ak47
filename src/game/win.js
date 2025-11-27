// src/game/win.js
import { gameState } from './state.js';
/**
 * Check if a hand contains ACE, KING, 4, 7
 */
export function hasAK47(hand) {
    const values = hand.map(c => c.value);
    return (
        values.includes("ACE") &&
        values.includes("KING") &&
        values.includes("4") &&
        values.includes("7")
    );
}

/**
 * Check if hand contains ANY pair (2 cards of same value)
 */
export function hasPair(hand) {
    const counts = {};
    for (let c of hand) {
        counts[c.value] = (counts[c.value] || 0) + 1;
        if (counts[c.value] >= 2) return true;
    }
    return false;
}

/**
 * Player wins if:
 * - Has AK47 OR
 * - Has a pair
 */
export function hasWinningHand(hand) {
    switch (gameState.rules.winMode) {
        case "ak47":
            return isAK47(hand);

        case "pairs":
            return hasTwoPairs(hand);

        case "sequence":
            return isSequence(hand);

        default:
            return false;
    }
}

function isAK47(hand) {
    const needed = ["ACE", "KING", "4", "7"];
    const values = hand.map(c => c.value);
    return needed.every(v => values.includes(v));
}

function hasTwoPairs(hand) {
    const counts = {};
    for (const card of hand) {
        counts[card.value] = (counts[card.value] || 0) + 1;
    }

    const pairs = Object.values(counts).filter(n => n === 2);
    return pairs.length === 2;  // exactly two pairs
}

const valueOrder = {
    "ACE": 14,
    "KING": 13,
    "QUEEN": 12,
    "JACK": 11,
    "10": 10,
    "9": 9,
    "8": 8,
    "7": 7,
    "6": 6,
    "5": 5,
    "4": 4,
    "3": 3,
    "2": 2
};

function isSequence(hand) {
    const nums = hand.map(c => valueOrder[c.value]).sort((a, b) => a - b);

    for (let i = 0; i < nums.length - 1; i++) {
        if (nums[i + 1] !== nums[i] + 1) return false;
    }
    return true;
}


/**
 * Potential win means:
 * - Player does NOT have AK47 yet
 * but after drawing a card, now has a chance to win next turn
 *
 * For this module, we treat "potential win" as:
 * - Has 3 of the AK47 needed
 * - OR already has a PAIR (pairs win immediately, so no potential state needed)
 */
export function hasPotentialWinningHand(hand) {
    const values = hand.map(c => c.value);

    // Check for 3/4 of AK47 set
    const required = ["ACE", "KING", "4", "7"];
    let count = 0;
    required.forEach(v => {
        if (values.includes(v)) count++;
    });

    if (count === 3) return true;

    // If already has pair, it's a winning hand (handled separately)
    return false;
}
