// src/game/ai.js
import { gameState } from './state.js';
import {
    selectCardForDiscard,
    discardSelectedCard,
    drawFromDeck,
    takeTopDiscard,
    replaceDiscardedSlotWith,
    completeTurnAfterReplacement,
    endTurn
} from './turn.js';
import { renderAll } from '../ui/render.js';
import { hasWinningHand, hasPotentialWinningHand, valueOrder } from './win.js';
import { showToast } from '../ui/toast.js';
import { lockBoard, unlockBoard } from "../ui/lock.js";


/** small sleep helper */
function sleep(ms = 600) {
    return new Promise(res => setTimeout(res, ms));
}

/** Score a hand for AI heuristics (higher is better) */
function scoreHand(hand) {

    const mode = gameState.rules.winMode;

    if (hasWinningHand(hand)) return 9999;

    switch (mode) {
        case "ak47":
            return scoreAK47(hand);

        case "pairs":
            return scorePairs(hand);

        case "sequence":
            return scoreSequence(hand);

        default:
            return 0;
    }
}

function scoreAK47(hand) {
    const needed = ["ACE", "KING", "4", "7"];
    let score = 0;
    const values = hand.map(c => c.value);
    needed.forEach(v => {
        if (values.includes(v)) score += 25;
    });

    hand.forEach(c => score += valueOrder[c.value] / 10); // small bonus for high cards
    return score;
}


function scorePairs(hand) {
    const counts = {};
    hand.forEach(c => counts[c.value] = (counts[c.value] || 0) + 1);

    let score = 0;

    for (const value in counts) {
        if (counts[value] === 2) score += 40;
    }

    hand.forEach(c => {
        if (counts[c.value] === 1) {
            score += valueOrder[c.value] / 10; // small bonus for high unpaired cards
        }
    });
    return score;
}

function scoreSequence(hand) {
    const nums = hand.map(c => valueOrder[c.value]).sort((a, b) => a - b);
    let score = 0;

    // reward small straights (3-in-a-row)
    for (let i = 0; i < nums.length - 2; i++) {
        if (nums[i + 1] === nums[i] + 1 && nums[i + 2] === nums[i] + 1) {
            score += 60;
        }
    }

    //reward adjacent cards (2-in-a row)
    for (let i = 0; i < nums.length - 1; i++) {
        if (nums[i + 1] === nums[i] + 1) score += 20;
    }

    //reward general card quality
    nums.forEach(n => score += n / 10);

    return score;
}



/**
 * Find index of a card in hand that is least useful (lowest resulting score if kept)
 * If newCard provided, compute which index to replace to maximize score (AI will discard that card).
 */
function chooseDiscardIndex(hand, newCard = null) {
    let bestScore = -Infinity;
    let bestIndex = 0;

    // If newCard == null, we evaluate which card to discard without replacement (used rarely)
    for (let i = 0; i < hand.length; i++) {
        const simulated = hand.slice();

        if (newCard) {
            simulated[i] = newCard; // simulate replacement
        } else {
            simulated.splice(i, 1); // simulate discard without replacement
        }

        const score = scoreHand(simulated);
        if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }
    return bestIndex;
}



/**
 * AI main routine: plays one full turn for player with id = aiId (default 1)
 */
export async function aiTakeTurn(aiId = 1) {
    // sanity: only run for actual AI turn
    if (gameState.currentPlayerIndex !== aiId) return;

    // tiny think delay
    await sleep(400);

    const player = gameState.players[aiId];

    // If AI currently must declare and hasn't yet, auto-declare
    if (player.mustDeclare && !player.declared) {
        player.declared = true;
        // show small message
        // (renderAll will show/hide declare button accordingly)
        await sleep(300);
    }

    // Decide whether to take top discard
    const topDiscard = gameState.discardPile.length ? gameState.discardPile[gameState.discardPile.length - 1] : null;
    let takeDiscard = false;
    let chosenIndex = 0;

    // simulate if topDiscard helps
    if (topDiscard) {
        // if top discard is the AI's own just-discarded card, it cannot take it
        if (gameState.ui.lastDiscardBy !== aiId) {
            // choose best index to replace with discard
            const idxIfTaken = chooseDiscardIndex(player.hand, topDiscard);
            // compute score if taken
            const handIfTaken = player.hand.slice();
            handIfTaken.splice(idxIfTaken, 1, topDiscard);
            const scoreTaken = scoreHand(handIfTaken);

            // compute best score by drawing from deck (approximate using current hand)
            const bestIdxIfDraw = chooseDiscardIndex(player.hand, null);
            const handIfDraw = player.hand.slice(); // unknown draw -> assume same score baseline
            const scoreNow = scoreHand(player.hand);

            // heuristic: prefer taking discard if it strictly improves score or gives immediate win
            if (scoreTaken > scoreNow || hasWinningHand(handIfTaken) || hasPotentialWinningHand(handIfTaken)) {
                takeDiscard = true;
                chosenIndex = idxIfTaken;
            }
        }
    }

    if (takeDiscard) {
        // take top discard flow (mirror player logic)
        const taken = takeTopDiscard(); // pops discard
        if (!taken) {
            // fallback to drawing
            // continue to draw branch below
        } else {
            // choose a slot to replace
            selectCardForDiscard(aiId, chosenIndex);
            // we must discard the selected card (this pushes to discard pile)
            discardSelectedCard();
            // place taken into slot
            replaceDiscardedSlotWith(taken);

            const result = completeTurnAfterReplacement();
            renderAll();

            // If must-declare, AI will auto-declare
            if (result === 'must-declare') {
                player.declared = true;
                renderAll();
                await sleep(350);
                endTurn();
                renderAll();
                return 'normal';
            }

            if (result === 'win-now') {
                // AI wins — handle in caller (we'll just render for now)
                showToast("Computer Wins!", 1500, true);
                lockBoard();
                document.getElementById('restartBtn').classList.remove('hidden');
                return 'win-now';
            }

            // normal: end turn
            endTurn();
            renderAll();
            return;
        }
    }

    // else draw from deck
    // choose a discard slot now (simulate which card to discard after draw)
    const presumptiveIndex = chooseDiscardIndex(player.hand, null);

    // select then discard, draw, replace
    selectCardForDiscard(aiId, presumptiveIndex);
    discardSelectedCard();

    // draw
    let drawn = null;
    try {
        drawn = await drawFromDeck();
    } catch (err) {
        console.error("AI draw failed:", err);
        // if draw fails (deck empty), attempt to end gracefully
    }

    if (drawn) {
        replaceDiscardedSlotWith(drawn);

        const result = completeTurnAfterReplacement();
        renderAll();

        if (result === 'must-declare') {
            player.declared = true;
            renderAll();
            await sleep(350);
            endTurn();
            renderAll();
            return;
        }

        if (result === 'win-now') {
            showToast("Computer Wins!", 1500, true);
            lockBoard();
            document.getElementById('restartBtn').classList.remove('hidden');
            return 'win-now';
        }
    }

    // finally end turn
    await sleep(250);
    endTurn();
    renderAll();
}
