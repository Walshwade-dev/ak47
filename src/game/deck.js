// src/game/deck.js
export async function newShuffledDeck() {
  const res = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
  if (!res.ok) throw new Error('Failed to create deck');
  return res.json(); // { deck_id, remaining, ... }
}

export async function drawCards(deckId, count = 1) {
  const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
  if (!res.ok) throw new Error('Failed to draw cards');
  return res.json(); // { cards: [...], remaining }
}
