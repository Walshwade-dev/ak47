export function animateCardMove(sourceEl, targetEl, duration = 400) {
    if (!sourceEl || !targetEl) return Promise.resolve();

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const clone = sourceEl.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.zIndex = '60';
    clone.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
    document.body.appendChild(clone);

    const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

    requestAnimationFrame(() => {
        clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.9)`;
        clone.style.opacity = '0.9';
    });

    return new Promise(res => {
        setTimeout(() => {
            clone.remove();
            res();
        }, duration + 20);
    });
}