// src/game/win.js
import { gameState } from './state.js';

/* ------------------------------------------
   VALUE ORDER (for sequence)
--------------------------------------------- */
export const valueOrder = {
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

/* ------------------------------------------
   WIN CHECKERS
--------------------------------------------- */
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

/* -------- AK47 WIN -------- */
function isAK47(hand) {
    const needed = ["ACE", "KING", "4", "7"];
    const values = hand.map(c => c.value);
    return needed.every(v => values.includes(v));
}

/* -------- TWO PAIRS WIN -------- */
function hasTwoPairs(hand) {
    const counts = {};
    hand.forEach(c => counts[c.value] = (counts[c.value] || 0) + 1);

    const pairs = Object.values(counts).filter(n => n === 2);
    return pairs.length === 2; // exactly 2 pairs
}

/* -------- SEQUENCE WIN -------- */
function isSequence(hand) {
    const nums = hand.map(c => valueOrder[c.value]).sort((a, b) => a - b);

    for (let i = 0; i < nums.length - 1; i++) {
        if (nums[i + 1] !== nums[i] + 1) return false;
    }
    return true;
}

/* ------------------------------------------
   POTENTIAL WIN CHECKERS (DECLARE)
--------------------------------------------- */
export function hasPotentialWinningHand(hand) {
    switch (gameState.rules.winMode) {
        case "ak47":
            return isPotentialAK47(hand);

        case "pairs":
            return isPotentialTwoPairs(hand);

        case "sequence":
            return isPotentialSequence(hand);

        default:
            return false;
    }
}

/* -------- AK47 ALMOST -------- */
function isPotentialAK47(hand) {
    const values = hand.map(c => c.value);
    const needed = ["ACE", "KING", "4", "7"];

    let count = 0;
    needed.forEach(v => {
        if (values.includes(v)) count++;
    });

    return count === 3; // 3/4 means must declare
}

/* -------- TWO PAIRS ALMOST -------- */
function isPotentialTwoPairs(hand) {
    const counts = {};
    hand.forEach(c => counts[c.value] = (counts[c.value] || 0) + 1);

    const pairs = Object.values(counts).filter(n => n === 2);
    const singles = Object.values(counts).filter(n => n === 1);

    // Already winning
    if (pairs.length >= 2) return false;

    // Potential: 1 pair + 2 singles
    return pairs.length === 1 && singles.length === 2;
}

/* -------- SEQUENCE ALMOST -------- */
function isPotentialSequence(hand) {
    const nums = hand.map(c => valueOrder[c.value]).sort((a, b) => a - b);

    // Check ANY 3 consecutive inside the 4
    for (let i = 0; i < nums.length - 2; i++) {
        if (
            nums[i + 1] === nums[i] + 1 &&
            nums[i + 2] === nums[i + 1] + 1
        ) {
            return true;
        }
    }
    return false;
}
