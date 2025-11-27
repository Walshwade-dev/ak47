// src/utils/helpers.js
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalizeCardValue(v) {
  // v could be "ACE", "2", "JACK", etc.
  const map = { 'JACK':11, 'QUEEN':12, 'KING':13, 'ACE':14 };
  const n = parseInt(v, 10);
  if (!isNaN(n)) return n;
  return map[v] ?? 0;
}

export function getRandomCardBack(cardBacks) {
  const index = Math.floor(Math.random() * cardBacks.length);
  return cardBacks[index];
}
