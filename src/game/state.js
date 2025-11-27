// src/game/state.js
export const gameState = {
    deckId: null,
    drawRemaining: 0,
    drawPile: [],        // optional: cached cards if you want to store
    discardPile: [],     // face-up ordered array (last = top)
    currentTurn: 0,
    players: [
        { id: 0, name: "Player 1", hand: [], declared: false, canWinNextTurn: true, penaltyUntilTurn: null, mustDeclare: false },
        { id: 1, name: "Player 2", hand: [], declared: false, canWinNextTurn: true, penaltyUntilTurn: null, mustDeclare: false }
    ],
    currentPlayerIndex: 0,
    gameOver: false,
    winner: null,
    ui: {
        background: '/assets/pokergreen.jpg', // default
        cardBacks: [
            '/assets/pokercardgreen.png',
            '/assets/pokercardpurple.png',
            '/assets/pokercardred.png'
        ],

        // dynamic runtime flags:
        selectedCard: null,     // { playerId, cardIndex } or null
        lastDiscardBy: null     // playerId who made the last discard (used to prevent immediate pickup)
    },
    rules: {
        allowPairs: false,
        winMode: 'ak47'  // default
    }
};
