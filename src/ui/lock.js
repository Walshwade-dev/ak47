export function lockBoard() {
    document.getElementById("drawPile").style.pointerEvents = "none";
    document.getElementById("discardPile").style.pointerEvents = "none";
    document.getElementById("playerHand").style.pointerEvents = "none";
}

export function unlockBoard() {
    document.getElementById("drawPile").style.pointerEvents = "auto";
    document.getElementById("discardPile").style.pointerEvents = "auto";
    document.getElementById("playerHand").style.pointerEvents = "auto";
}
