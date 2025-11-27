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
import { hasWinningHand, hasPotentialWinningHand } from './win.js';

/** small sleep helper */
function sleep(ms = 600) {
    return new Promise(res => setTimeout(res, ms));
}

/** Score a hand for AI heuristics (higher is better) */
function scoreHand(hand) {
    // give priority to immediate win
    if (hasWinningHand(hand)) return 1000;
    // potential: count how many of AK47 matched
    const needed = ["ACE", "KING", "4", "7"];
    let match = 0;
    for (const v of needed) if (hand.some(c => c.value === v)) match++;
    // pairs add weight
    const counts = {};
    let bestPair = 0;
    for (const c of hand) {
        counts[c.value] = (counts[c.value] || 0) + 1;
        bestPair = Math.max(bestPair, counts[c.value]);
    }
    // score = base from matches + pair bonus
    return match * 30 + bestPair * 50;
}

/**
 * Find index of a card in hand that is least useful (lowest resulting score if kept)
 * If newCard provided, compute which index to replace to maximize score (AI will discard that card).
 */
function chooseDiscardIndex(hand, newCard = null) {
    let bestScore = -Infinity;
    let bestReplaceIndex = 0;

    // If newCard == null, we evaluate which card to discard without replacement (used rarely)
    for (let i = 0; i < hand.length; i++) {
        const simulated = hand.slice();
        if (newCard) {
            // simulate replacing card i with newCard
            simulated.splice(i, 1, newCard);
        } else {
            // simulate removing card i (not replacing) -> we will evaluate with a placeholder low score
            simulated.splice(i, 1);
        }
        const sc = scoreHand(simulated);
        if (sc > bestScore) {
            bestScore = sc;
            bestReplaceIndex = i;
        }
    }
    return bestReplaceIndex;
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

            renderAll();
            return;
        }
    }

    // finally end turn
    await sleep(250);
    endTurn();
    renderAll();
}
