// src/ui/render.js
import { gameState } from '../game/state.js';
import { getRandomCardBack } from '../utils/helpers.js';

/* ------------------------------------------
   CARD FACTORIES
------------------------------------------- */
function createCardImgFront(card) {
    const img = document.createElement('img');
    img.src = card.image;
    img.alt = `${card.value} of ${card.suit}`;
    img.loading = 'lazy';
    img.className = 'w-20 h-28 lg:w-32 lg:h-48 object-cover rounded-lg shadow-md pointer-events-none';
    img.style.willChange = 'transform, opacity';
    img.style.backfaceVisibility = 'hidden';
    img.style.transform = 'translateZ(0)';
    return img;
}

function createCardImgBack() {
    const img = document.createElement('img');
    img.src = getRandomCardBack(gameState.ui.cardBacks);
    img.alt = 'card back';
    img.loading = 'lazy';
    img.className = 'w-20 h-28 lg:w-32 lg:h-48 object-cover rounded-lg shadow-md pointer-events-none';
    img.style.willChange = 'transform, opacity';
    img.style.backfaceVisibility = 'hidden';
    img.style.transform = 'translateZ(0)';
    return img;
}

/* ------------------------------------------
   RENDER PLAYER & OPPONENT HANDS
------------------------------------------- */
export function renderHands() {
    const playerHandEl = document.getElementById('playerHand');
    const opponentHandEl = document.getElementById('opponentHand');

    playerHandEl.innerHTML = '';
    opponentHandEl.innerHTML = '';

    const selected = gameState.ui.selectedCard;

    /* ---- PLAYER HAND ---- */
    gameState.players[0].hand.forEach((card, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'w-20 h-28 lg:w-32 lg:h-48  relative cursor-pointer inline-flex items-center justify-center';
        wrapper.dataset.playerId = 0;
        wrapper.dataset.cardIndex = idx;

        const inner = document.createElement('div');
        inner.className = 'rounded-lg overflow-hidden';
        inner.appendChild(createCardImgFront(card));
        wrapper.appendChild(inner);

        if (selected && selected.playerId === 0 && selected.cardIndex === idx) {
            const highlight = document.createElement('div');
            highlight.style.position = 'absolute';
            highlight.style.inset = '0';
            highlight.style.borderRadius = '0.5rem';
            highlight.style.pointerEvents = 'none';
            highlight.style.zIndex = '20';
            highlight.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.9)';
            wrapper.appendChild(highlight);
        }

        playerHandEl.appendChild(wrapper);
    });

    /* ---- OPPONENT HAND ---- */
    gameState.players[1].hand.forEach(() => {
        const wrapper = document.createElement('div');
        wrapper.className = 'w-20 h-28 lg:w-32 lg:h-48 relative inline-flex items-center justify-center';

        wrapper.appendChild(createCardImgBack());
        opponentHandEl.appendChild(wrapper);
    });
}

/* ------------------------------------------
   RENDER PILES
------------------------------------------- */
export function renderPiles() {
    const drawPileEl = document.getElementById('drawPile');
    const discardPileEl = document.getElementById('discardPile');
    const reshuffleEl = document.getElementById('reshuffleBtn');

    drawPileEl.innerHTML = '';
    discardPileEl.innerHTML = '';

    // Draw pile face-down
    const back = getRandomCardBack(gameState.ui.cardBacks);
    drawPileEl.innerHTML = `
        <img src="${back}" class="w-full h-full object-cover rounded shadow-inner pointer-events-none" />
        <div class="text-white text-sm mt-1 text-center">Remaining: ${gameState.drawRemaining}</div>
    `;

    // Discard top card
    if (gameState.discardPile.length > 0) {
        const top = gameState.discardPile.at(-1);
        const img = document.createElement('img');
        img.src = top.image;
        img.className = 'w-full h-full object-cover rounded-lg shadow-md pointer-events-none';
        discardPileEl.appendChild(img);
    } else {
        discardPileEl.innerHTML = `
            <div class="w-full h-full flex items-center justify-center text-gray-300 border-2 border-[#0b2b26] rounded-lg pointer-events-none">
                Empty
            </div>
        `;
    }

    // Show/hide reshuffle
    if (
        gameState.drawRemaining <= 0 &&
        (gameState.drawPileLocal?.length ?? 0) === 0 &&
        gameState.discardPile.length > 1
    ) {
        reshuffleEl?.classList.remove('hidden');
    } else {
        reshuffleEl?.classList.add('hidden');
    }
}

/* ------------------------------------------
   MAIN RENDER WRAPPER
------------------------------------------- */
export function renderAll() {
    renderHands();
    renderPiles();

    // Declare button
    const declareBtn = document.getElementById('declareBtn');
    const player = gameState.players[gameState.currentPlayerIndex];

    if (player.mustDeclare && !player.declared) {
        declareBtn.classList.remove('hidden');
    } else {
        declareBtn.classList.add('hidden');
    }

    document.getElementById('deckId').textContent = gameState.deckId ?? 'abcd1234';
    document.getElementById('remaining').textContent = gameState.drawRemaining ?? '0';
    document.getElementById('currentPlayer').textContent = player.name;
}
