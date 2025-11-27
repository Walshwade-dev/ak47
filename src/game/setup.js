// src/game/setup.js
import { gameState } from './state.js';
import { newShuffledDeck, drawCards } from './deck.js';

export async function startNewGame() {
  // create deck
  const deck = await newShuffledDeck();
  gameState.deckId = deck.deck_id;

  // draw initial hands
  const playersCount = gameState.players.length;
  const drawCount = playersCount * 4;
  const drawData = await drawCards(gameState.deckId, drawCount);

  // distribute in order
  const cards = drawData.cards;
  for (let i = 0; i < playersCount; i++) {
    gameState.players[i].hand = cards.slice(i*4, i*4 + 4);
  }

  gameState.drawRemaining = drawData.remaining;
  gameState.discardPile = []; // reset
  gameState.currentPlayerIndex = 0;
  gameState.gameOver = false;
  gameState.winner = null;

  return gameState;
}
