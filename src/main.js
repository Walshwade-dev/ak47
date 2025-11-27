import './style.css';
import { attachUI } from './ui/events.js';
import { renderAll } from './ui/render.js';

attachUI();
renderAll(); // initial render


function updateVH() {
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
}

updateVH();
window.addEventListener('resize', updateVH);
