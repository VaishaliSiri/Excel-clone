// js/main.js
import { CanvasManager } from './canvas.js';

const wrapper = document.createElement('div');
wrapper.id = 'grid-wrapper';
document.body.appendChild(wrapper);

const grid = new CanvasManager(wrapper);

