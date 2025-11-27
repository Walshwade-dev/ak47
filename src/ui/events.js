// src/ui/events.js
import { startNewGame } from '../game/setup.js';
import { renderAll } from './render.js';
import { gameState } from '../game/state.js';
import { aiTakeTurn } from '../game/ai.js';
import { showToast } from './toast.js';

import {
    selectCardForDiscard,
    discardSelectedCard,
    completeTurnAfterReplacement,
    drawFromDeck,
    takeTopDiscard,
    replaceDiscardedSlotWith,
    reshuffleDiscardToDraw,
    endTurn
} from '../game/turn.js';

import { lockBoard, unlockBoard } from "./lock.js";


const reshuffleBtn = document.getElementById('reshuffleBtn');


// create button dynamically if not present
if (!reshuffleBtn) {
    const btn = document.createElement('button');
    btn.id = 'reshuffleBtn';
    btn.className = 'hidden ml-2 font-semibold bg-indigo-500 text-white px-3 py-1 rounded';
    btn.textContent = 'Reshuffle';
    // append to header controls (you have a container)
    document.querySelector('header .flex.gap-2')?.appendChild(btn);
}

const reshuffleEl = document.getElementById('reshuffleBtn');
reshuffleEl.addEventListener('click', () => {
    const ok = reshuffleDiscardToDraw();
    if (!ok) {
        alert('Not enough cards to reshuffle.');
        return;
    }
    // Re-enable draws and update UI
    renderAll();
    reshuffleEl.classList.add('hidden');
});



export function attachUI() {
    const startBtn = document.getElementById('startBtn');
    const bgSelector = document.getElementById('bgSelector');
    const gameTypeSelector = document.getElementById("winRule");
    const restartBtn = document.getElementById("restartBtn");
    const declareBtn = document.getElementById("declareBtn");

    /* -----------------------------------------
       GAME MODE CHANGED → UPDATE RULE & TITLE
    ----------------------------------------- */
    gameTypeSelector.addEventListener("change", (e) => {
        gameState.rules.winMode = e.target.value;

        const title = document.querySelector("h1");
        switch (e.target.value) {
            case "ak47":
                title.textContent = "AK47 CARDS";
                break;
            case "pairs":
                title.textContent = "TWO PAIRS";
                break;
            case "sequence":
                title.textContent = "SEQUENCE RUN";
                break;
        }
    });


    /* -------------------------
       Start Game
    ------------------------- */
    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        startBtn.textContent = 'Dealing...';

        try {
            await startNewGame();
            unlockBoard();
            // Hide win banners, clear status message, hide restart
            document.getElementById("statusMessage").classList.add("hidden");
            document.getElementById("statusMessage").textContent = "";
            document.getElementById("restartBtn")?.classList.add("hidden");

            // remove any selection overlays
            document.querySelectorAll(".selection-overlay").forEach(el => el.remove());

            // reset AI/player declare states
            gameState.players.forEach(p => {
                p.declared = false;
                p.mustDeclare = false;
                p.canWinNextTurn = true;
            });

            renderAll();
        } catch (err) {
            alert('Failed to start game: ' + err.message);
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Game';
        }
    });


    /* -------------------------
       Background Change
    ------------------------- */
    bgSelector.addEventListener('change', (e) => {
        const url = e.target.value;
        document.body.style.backgroundImage = `url(${url})`;
        gameState.ui.background = url;
    });


    /* -------------------------
       Player Card Select
    ------------------------- */
    document.getElementById('playerHand').addEventListener('click', (e) => {
        const wrapper = e.target.closest('[data-player-id]');
        if (!wrapper) return;

        if (gameState.currentPlayerIndex !== 0) return; // prevent selecting during AI turn

        const playerId = Number(wrapper.dataset.playerId);
        const cardIndex = Number(wrapper.dataset.cardIndex);

        const ok = selectCardForDiscard(playerId, cardIndex);
        if (!ok) return;

        document.querySelectorAll('.selection-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className =
            'selection-overlay absolute inset-0 border border-yellow-300 rounded-lg pointer-events-none z-20';
        wrapper.appendChild(overlay);
    });


    /* ---------------------------------------------
       DRAW PILE CLICK → DISCARD → DRAW → REPLACE
    --------------------------------------------- */
    document.getElementById('drawPile').addEventListener('click', async () => {
        if (!gameState.ui.selectedCard) {
            alert('Select a card first.');
            return;
        }

        try {
            discardSelectedCard();

            const drawn = await drawFromDeck();
            replaceDiscardedSlotWith(drawn);

            const result = completeTurnAfterReplacement();
            renderAll();

            if (result === "win-now") {
                showToast("Player 1 Wins!", 1500, true);
                lockBoard();
                restartBtn.classList.remove("hidden");
                return;
            }

            if (result === "must-declare") return;

            // Normal turn end
            endTurn();
            renderAll();

            // AI turn
            if (gameState.currentPlayerIndex === 1) {
                const aiResult = await aiTakeTurn(1);
                renderAll();

                if (aiResult === "win-now") {
                    showToast("Computer Wins!", 1500, true);
                    lockBoard();
                    restartBtn.classList.remove("hidden");
                }
            }

        } catch (err) {
            alert('Error drawing card: ' + err.message);
        }
    });



    /* ---------------------------------------------
       DISCARD PILE → TAKE TOP → DISCARD → REPLACE
    --------------------------------------------- */
    document.getElementById('discardPile').addEventListener('click', async () => {
        if (!gameState.ui.selectedCard) {
            alert('Select a card first.');
            return;
        }

        const taken = takeTopDiscard();
        if (!taken) {
            alert('Cannot take that discard.');
            return;
        }

        discardSelectedCard();
        replaceDiscardedSlotWith(taken);

        const result = completeTurnAfterReplacement();
        renderAll();

        if (result === "win-now") {
            showToast("Player 1 Wins!", 1500, true);
            lockBoard();
            restartBtn.classList.remove("hidden");
            return;
        }

        if (result === "must-declare") return;

        endTurn();
        renderAll();

        if (gameState.currentPlayerIndex === 1) {
            const aiResult = await aiTakeTurn(1);
            renderAll();

            if (aiResult === "win-now") {
                showToast("Computer Wins!", 1500, true);
                lockBoard();
                restartBtn.classList.remove("hidden");
            }
        }
    });




    /* -------------------------
       DECLARE BUTTON
    ------------------------- */
    declareBtn.addEventListener('click', () => {
        const player = gameState.players[0];

        if (!player.mustDeclare) {
            alert('Nothing to declare.');
            return;
        }

        player.declared = true;
        showToast("Player Declares!");

        declareBtn.classList.add("hidden");
    });



    /* -------------------------
       RESTART BUTTON
    ------------------------- */
    restartBtn.addEventListener('click', async () => {
        restartBtn.classList.add("hidden");
        unlockBoard();

        document.getElementById("statusMessage").classList.add("hidden");
        document.getElementById("statusMessage").textContent = "";

        await startNewGame();
        renderAll();
    });
}
