import { CanvasManager } from './canvas.js';
import { Navbar } from './Navbar.js';
import { Resizer } from './Resizer.js';

const wrapper = document.createElement('div');
wrapper.id = 'grid-wrapper';
document.body.appendChild(wrapper);

const grid = new CanvasManager(wrapper);
const resizer = new Resizer(grid);
grid.resizer = resizer;

const navbar = new Navbar(grid);
grid.navbar = navbar;
