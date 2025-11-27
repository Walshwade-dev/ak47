export function showToast(message, duration = 6000, persistent = false) {
    const el = document.getElementById("statusMessage");
    if (!el) return;

    el.textContent = message;
    el.classList.remove("hidden", "opacity-0");
    el.classList.add("opacity-100");

    // WIN → persistent message (no auto close)
    if (persistent) return;

    // NORMAL toast → auto close
    setTimeout(() => {
        el.classList.add("opacity-0");
        setTimeout(() => {
            el.classList.add("hidden");
            el.textContent = "";
        }, 3000);
    }, duration);
}
