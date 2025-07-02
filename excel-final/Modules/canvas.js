import { Selection } from './Selection.js';

export class CanvasManager {
  constructor(container) {
    this.container = container;

    this.HEADER_HEIGHT = 30;
    this.HEADER_WIDTH = 50;
    this.CELL_WIDTH = 100;
    this.CELL_HEIGHT = 30;

    this.totalCols = 500;
    this.totalRows = 100000;

    this.scrollX = 0;
    this.scrollY = 0;

    this.colHeaderCanvas = document.createElement('canvas');
    this.rowHeaderCanvas = document.createElement('canvas');
    this.mainGridCanvas = document.createElement('canvas');

    this.ctxColHeader = this.colHeaderCanvas.getContext('2d');
    this.ctxRowHeader = this.rowHeaderCanvas.getContext('2d');
    this.ctxMainGrid = this.mainGridCanvas.getContext('2d');

    this.scroller = document.createElement('div');
    this.selection = new Selection(this);

    this.initDOM();
    this.attachEvents();
  }

  initDOM() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.width = '100vw';
    this.container.style.height = '100vh';

    this.styleCanvas(this.colHeaderCanvas, this.HEADER_WIDTH, 0);
    this.styleCanvas(this.rowHeaderCanvas, 0, this.HEADER_HEIGHT);
    this.styleCanvas(this.mainGridCanvas, this.HEADER_WIDTH, this.HEADER_HEIGHT);

    this.scroller.style.position = 'absolute';
    this.scroller.style.width = `${this.HEADER_WIDTH + this.totalCols * this.CELL_WIDTH}px`;
    this.scroller.style.height = `${this.HEADER_HEIGHT + this.totalRows * this.CELL_HEIGHT}px`;
    this.scroller.style.pointerEvents = 'none';

    this.scrollWrapper = document.createElement('div');
    this.scrollWrapper.style.position = 'absolute';
    this.scrollWrapper.style.top = '0';
    this.scrollWrapper.style.left = '0';
    this.scrollWrapper.style.right = '0';
    this.scrollWrapper.style.bottom = '0';
    this.scrollWrapper.style.overflow = 'scroll';

    this.scrollWrapper.appendChild(this.scroller);
    this.container.appendChild(this.colHeaderCanvas);
    this.container.appendChild(this.rowHeaderCanvas);
    this.container.appendChild(this.mainGridCanvas);
    this.container.appendChild(this.scrollWrapper);
  }

  styleCanvas(canvas, left, top) {
    canvas.style.position = 'absolute';
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    canvas.style.background = '#fff';
  }

  attachEvents() {
    this.scrollWrapper.addEventListener('scroll', () => {
      this.scrollX = this.scrollWrapper.scrollLeft;
      this.scrollY = this.scrollWrapper.scrollTop;
      this.render();
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();

    this.mainGridCanvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.mainGridCanvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    document.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  onPointerDown(e) {
    const { row, col } = this.getCellFromClientCoords(e.clientX, e.clientY);
    if (this.isValidCell(row, col)) {
      this.selection.startSelection(row, col);
      this.render();
    }
  }

  onPointerMove(e) {
    if (this.selection.active) {
      const { row, col } = this.getCellFromClientCoords(e.clientX, e.clientY);
      if (this.isValidCell(row, col)) {
        this.selection.updateSelection(row, col);
        this.render();
      }
    }
  }

  onPointerUp(e) {
    if (this.selection.active) {
      this.selection.endSelection();
      this.render();
    }
  }

  resize() {
    this.viewportWidth = this.container.clientWidth;
    this.viewportHeight = this.container.clientHeight;

    const gridWidth = this.viewportWidth - this.HEADER_WIDTH;
    const gridHeight = this.viewportHeight - this.HEADER_HEIGHT;

    this.visibleCols = Math.ceil(gridWidth / this.CELL_WIDTH);
    this.visibleRows = Math.ceil(gridHeight / this.CELL_HEIGHT);

    this.colHeaderCanvas.width = gridWidth;
    this.colHeaderCanvas.height = this.HEADER_HEIGHT;

    this.rowHeaderCanvas.width = this.HEADER_WIDTH;
    this.rowHeaderCanvas.height = gridHeight;

    this.mainGridCanvas.width = gridWidth;
    this.mainGridCanvas.height = gridHeight;

    this.render();
  }

getCellFromClientCoords(clientX, clientY) {
  const rect = this.mainGridCanvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const offsetX = x + this.scrollX;
  const offsetY = y + this.scrollY;
  const col = Math.floor(offsetX / this.CELL_WIDTH);
  const row = Math.floor(offsetY / this.CELL_HEIGHT);
  return { row, col };
}

  isValidCell(row, col) {
    return row >= 0 && row < this.totalRows && col >= 0 && col < this.totalCols;
  }

  render() {
    this.drawColumnHeaders();
    this.drawRowHeaders();
    this.drawMainGrid();
  }

  drawColumnHeaders() {
    const ctx = this.ctxColHeader;
    ctx.clearRect(0, 0, this.colHeaderCanvas.width, this.colHeaderCanvas.height);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';

    const startCol = Math.floor(this.scrollX / this.CELL_WIDTH);
    const endCol = startCol + this.visibleCols + 1;

    ctx.strokeStyle = '#ccc';
    ctx.beginPath();

    for (let col = startCol; col < endCol && col < this.totalCols; col++) {
      const x = (col * this.CELL_WIDTH) - this.scrollX;
      ctx.fillText(this.getColumnName(col), x + this.CELL_WIDTH / 2, this.HEADER_HEIGHT / 2);
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.HEADER_HEIGHT);
    }

    ctx.moveTo(this.colHeaderCanvas.width - 0.5, 0);
    ctx.lineTo(this.colHeaderCanvas.width - 0.5, this.HEADER_HEIGHT);
    ctx.stroke();
  }

  drawRowHeaders() {
    const ctx = this.ctxRowHeader;
    ctx.clearRect(0, 0, this.rowHeaderCanvas.width, this.rowHeaderCanvas.height);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';

    const startRow = Math.floor(this.scrollY / this.CELL_HEIGHT);
    const endRow = startRow + this.visibleRows + 1;

    ctx.strokeStyle = '#ccc';
    ctx.beginPath();

    for (let row = startRow; row < endRow && row < this.totalRows; row++) {
      const y = (row * this.CELL_HEIGHT) - this.scrollY;
      ctx.fillText(row + 1, this.HEADER_WIDTH / 2, y + this.CELL_HEIGHT / 2);
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.HEADER_WIDTH, y + 0.5);
    }

    ctx.moveTo(0, this.rowHeaderCanvas.height - 0.5);
    ctx.lineTo(this.HEADER_WIDTH, this.rowHeaderCanvas.height - 0.5);
    ctx.stroke();
  }

  drawMainGrid() {
    const ctx = this.ctxMainGrid;
    ctx.clearRect(0, 0, this.mainGridCanvas.width, this.mainGridCanvas.height);

    const startCol = Math.floor(this.scrollX / this.CELL_WIDTH);
    const endCol = startCol + this.visibleCols + 1;
    const startRow = Math.floor(this.scrollY / this.CELL_HEIGHT);
    const endRow = startRow + this.visibleRows + 1;

    ctx.strokeStyle = '#e0e0e0';
    ctx.beginPath();

    for (let col = startCol; col <= endCol && col < this.totalCols; col++) {
      const x = (col * this.CELL_WIDTH) - this.scrollX;
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.mainGridCanvas.height);
    }

    for (let row = startRow; row <= endRow && row < this.totalRows; row++) {
      const y = (row * this.CELL_HEIGHT) - this.scrollY;
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.mainGridCanvas.width, y + 0.5);
    }

    this.selection.renderSelection(ctx);
    ctx.stroke();
  }

  getColumnName(index) {
    let name = '';
    while (index >= 0) {
      name = String.fromCharCode((index % 26) + 65) + name;
      index = Math.floor(index / 26) - 1;
    }
    return name;
  }
}
