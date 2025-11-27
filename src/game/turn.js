// src/game/turn.js
import { gameState } from './state.js';
import { drawCards } from './deck.js';
import {
    hasWinningHand,
    hasPotentialWinningHand
} from './win.js';

// -------------------------------------------------------------
// SELECT CARD
// -------------------------------------------------------------
export function selectCardForDiscard(playerId, cardIndex) {
    if (gameState.currentPlayerIndex !== playerId) return false;
    gameState.ui.selectedCard = { playerId, cardIndex };
    return true;
}

// -------------------------------------------------------------
// DISCARD LOGIC
// -------------------------------------------------------------
export function discardSelectedCard() {
    const sel = gameState.ui.selectedCard;
    if (!sel) return null;

    const { playerId, cardIndex } = sel;
    const player = gameState.players[playerId];

    const [card] = player.hand.splice(cardIndex, 1);
    gameState.discardPile.push(card);

    gameState.ui.lastDiscardBy = playerId;

    // Keep index for replacement
    gameState.ui.selectedCard = { playerId, cardIndex };
    return card;
}

// -------------------------------------------------------------
// DRAW FROM DECK USING API
// -------------------------------------------------------------
export async function drawFromDeck() {
    // If we have a local draw pile (from reshuffle), use that first
    if (gameState.drawPileLocal && gameState.drawPileLocal.length > 0) {
        const card = gameState.drawPileLocal.pop();
        // sync remaining
        gameState.drawRemaining = (gameState.drawRemaining ?? 0) - 1;
        return card;
    }

    // Otherwise fall back to API-backed draws
    if (!gameState.deckId) throw new Error('No deckId available');

    if (gameState.drawRemaining <= 0) {
        throw new Error('Draw pile empty');
    }

    const res = await drawCards(gameState.deckId, 1);
    const [card] = res.cards;
    gameState.drawRemaining = res.remaining;
    return card;
}



export function reshuffleDiscardToDraw() {
    // Need at least 1 card on discard to keep (top). if only 0 or 1 card, cannot reshuffle.
    if (!gameState.discardPile || gameState.discardPile.length <= 1) return false;

    // Save the topmost discard
    const top = gameState.discardPile[gameState.discardPile.length - 1];

    // Take everything except the top
    const toShuffle = gameState.discardPile.slice(0, gameState.discardPile.length - 1);

    // Fisher–Yates shuffle
    for (let i = toShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
    }

    // Set local draw pile (cards will be drawn face-down from here)
    gameState.drawPileLocal = toShuffle.slice().reverse(); // reverse so pop() takes from top of shuffled array
    // Update discard pile to contain only the top
    gameState.discardPile = [top];

    // Update remaining count
    gameState.drawRemaining = gameState.drawPileLocal.length;

    return true;
}


// -------------------------------------------------------------
// TAKE TOP DISCARD
// -------------------------------------------------------------
export function takeTopDiscard() {
    if (gameState.discardPile.length === 0) return null;

    const lastDiscardBy = gameState.ui.lastDiscardBy;

    if (lastDiscardBy === gameState.currentPlayerIndex) {
        return null; // cannot pick your own last discard
    }

    return gameState.discardPile.pop();
}

// -------------------------------------------------------------
// REPLACE CARD SLOT
// -------------------------------------------------------------
export function replaceDiscardedSlotWith(newCard) {
    const sel = gameState.ui.selectedCard;
    if (!sel) return false;

    const { playerId, cardIndex } = sel;
    const player = gameState.players[playerId];

    player.hand.splice(cardIndex, 0, newCard);

    // reset selection
    gameState.ui.selectedCard = null;

    // allow next player to take discard
    gameState.ui.lastDiscardBy = null;

    return true;
}

// -------------------------------------------------------------
// DECLARATION + PENALTY LOGIC
// -------------------------------------------------------------
export function evaluateDeclarationAfterDraw(playerId) {
    const player = gameState.players[playerId];

    // NOTE: Do NOT reset `player.declared` here — declarations should
    // be controlled by the DECLARE action and/or when a new turn actually starts.
    // Resetting here caused declared to be forgotten immediately.

    // 1) If the hand is already a winning hand
    if (hasWinningHand(player.hand)) {
        // If a penalty blocks immediate wins, indicate penalty
        if (!player.canWinNextTurn) {
            return "penalty-active";
        }
        // Otherwise signal immediate win
        return "win-now";
    }

    // 2) Potential winning hand (e.g., has 3 of the AK47 set)
    if (hasPotentialWinningHand(player.hand)) {
        player.mustDeclare = true;
        return "must-declare";
    }

    // 3) No potential — clear mustDeclare
    player.mustDeclare = false;
    return "normal";
}


export function applyPenaltyIfUndeclared(playerId) {
    const player = gameState.players[playerId];

    if (player.mustDeclare && !player.declared) {
        player.canWinNextTurn = false;
        player.penaltyUntilTurn = gameState.currentTurn + 1;
    }
}

export function updatePenaltyStatus(playerId) {
    const player = gameState.players[playerId];

    if (!player.canWinNextTurn &&
        player.penaltyUntilTurn === gameState.currentTurn) {
        player.canWinNextTurn = true;
        player.penaltyUntilTurn = null;
    }
}

// -------------------------------------------------------------
// COMPLETE TURN CYCLE
// -------------------------------------------------------------
export function completeTurnAfterReplacement() {
    const pid = gameState.currentPlayerIndex;
    const player = gameState.players[pid];

    if(hasWinningHand(player.hand)) {
        return "win-now";
    }

    if(hasPotentialWinningHand(player.hand)) {
        player.mustDeclare = true;
        return "must-declare";
    }

    // No potential — clear mustDeclare
    player.mustDeclare = false;
    return "normal";
}

// -------------------------------------------------------------
// END TURN
// -------------------------------------------------------------
export function endTurn() {
    const pid = gameState.currentPlayerIndex;

    // Apply penalty if player failed to declare
    applyPenaltyIfUndeclared(pid);

    // Move to next player
    gameState.currentPlayerIndex =
        (gameState.currentPlayerIndex + 1) % gameState.players.length;

    gameState.currentTurn = (gameState.currentTurn || 0) + 1;

    // Update penalty expiration for next player
    const nextId = gameState.currentPlayerIndex;
    updatePenaltyStatus(nextId);

    // Reset any UI selections
    gameState.ui.selectedCard = null;

    document.getElementById("statusMessage").classList.add('hidden');
    document.getElementById("statusMessage").textContent = "";

    gameState.players[gameState.currentPlayerIndex].declared = false;
}
