// script.js
import Grid from './classes/grid.js';
import Row from './classes/row.js';
import Column from './classes/column.js';
import Selection from './classes/selection.js';

// Create a canvas element dynamically
const canvas = document.createElement('canvas');
canvas.id = 'gridCanvas';
canvas.width = 1200;
canvas.height = 800;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// Create class instances
const rowManager = new Row();
const colManager = new Column();
const selectionManager = new Selection();
const grid = new Grid(canvas, ctx, rowManager, colManager, selectionManager);

// Render the grid
grid.drawGrid();
