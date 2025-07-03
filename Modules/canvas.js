import { Selection } from './Selection.js';
import { Resizer } from './Resizer.js';
import { Scrollbar } from './Scrollbar.js';

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
    this.resizer = new Resizer(this);

    this.autoScrollDirection = null;
    this.autoScrollRAF = null;
    this.lastPointerEvent = null;

    this.initDOM();
    this.attachEvents();
    this.scrollbar = new Scrollbar(this);
  }

  initDOM() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.width = '100vw';
    this.container.style.height = '100vh';

    this.styleCanvas(this.colHeaderCanvas, this.HEADER_WIDTH, 0);
    this.styleCanvas(this.rowHeaderCanvas, 0, this.HEADER_HEIGHT);
    this.styleCanvas(this.mainGridCanvas, this.HEADER_WIDTH, this.HEADER_HEIGHT);

    // Create invisible scroll wrapper for scroll events
    this.scrollWrapper = document.createElement('div');
    this.scrollWrapper.style.position = 'absolute';
    this.scrollWrapper.style.top = '0';
    this.scrollWrapper.style.left = '0';
    this.scrollWrapper.style.width = '100%';
    this.scrollWrapper.style.height = '100%';
    this.scrollWrapper.style.overflow = 'hidden';
    this.scrollWrapper.style.zIndex = '1';
    this.scrollWrapper.style.pointerEvents = 'none';

    // Create large content area for scrolling
    this.scroller = document.createElement('div');
    this.scroller.style.position = 'absolute';
    this.scroller.style.width = `${this.totalCols * this.CELL_WIDTH + this.HEADER_WIDTH}px`;
    this.scroller.style.height = `${this.totalRows * this.CELL_HEIGHT + this.HEADER_HEIGHT}px`;
    this.scroller.style.pointerEvents = 'none';

    this.colHeaderCanvas.style.zIndex = '10';
    this.rowHeaderCanvas.style.zIndex = '10';
    this.mainGridCanvas.style.zIndex = '5';

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
    canvas.style.pointerEvents = 'auto';
  }

  attachEvents() {
    // Custom scroll handling
    this.scrollWrapper.scrollLeft = 0;
    this.scrollWrapper.scrollTop = 0;

    window.addEventListener('resize', () => this.resize());
    this.resize();

    this.mainGridCanvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.mainGridCanvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    document.addEventListener('pointerup', this.onPointerUp.bind(this));

    // Add header click events
    this.colHeaderCanvas.addEventListener('pointerdown', this.onColHeaderPointerDown.bind(this));
    this.rowHeaderCanvas.addEventListener('pointerdown', this.onRowHeaderPointerDown.bind(this));

    // Mouse wheel scrolling with proper speed
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      // Adjust scroll speed for better user experience
      const scrollSpeed = 3;
      const deltaX = e.deltaX * scrollSpeed;
      const deltaY = e.deltaY * scrollSpeed;
      
      const maxScrollX = this.getMaxScrollX();
      const maxScrollY = this.getMaxScrollY();
      
      this.scrollX = Math.max(0, Math.min(maxScrollX, this.scrollX + deltaX));
      this.scrollY = Math.max(0, Math.min(maxScrollY, this.scrollY + deltaY));
      
      this.render();
      this.scrollbar.updateScrollbars();
    });
  }

  getMaxScrollX() {
    return Math.max(0, this.totalCols * this.CELL_WIDTH - (this.viewportWidth - this.HEADER_WIDTH - 17));
  }

  getMaxScrollY() {
    return Math.max(0, this.totalRows * this.CELL_HEIGHT - (this.viewportHeight - this.HEADER_HEIGHT - 17));
  }

  onColHeaderPointerDown(e) {
    // Check if this is a resize operation first
    if (this.resizer.isResizeZone(e, 'col')) {
      return; // Let the resizer handle it
    }

    const rect = this.colHeaderCanvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left + this.scrollX;
    
    let xOffset = 0;
    for (let col = 0; col < this.totalCols; col++) {
      const colWidth = this.resizer?.colSizes.get(col) ?? this.CELL_WIDTH;
      
      if (offsetX >= xOffset && offsetX < xOffset + colWidth) {
        // Select entire column
        this.selection.selectColumn(col);
        this.render();
        break;
      }
      
      xOffset += colWidth;
    }
  }

  onRowHeaderPointerDown(e) {
    // Check if this is a resize operation first
    if (this.resizer.isResizeZone(e, 'row')) {
      return; // Let the resizer handle it
    }

    const rect = this.rowHeaderCanvas.getBoundingClientRect();
    const offsetY = e.clientY - rect.top + this.scrollY;
    
    let yOffset = 0;
    for (let row = 0; row < this.totalRows; row++) {
      const rowHeight = this.resizer?.rowSizes.get(row) ?? this.CELL_HEIGHT;
      
      if (offsetY >= yOffset && offsetY < yOffset + rowHeight) {
        // Select entire row
        this.selection.selectRow(row);
        this.render();
        break;
      }
      
      yOffset += rowHeight;
    }
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
      this.lastPointerEvent = e;
      this.autoScrollIfNeeded(e);
    }
  }

  onPointerUp(e) {
    if (this.selection.active) {
      this.selection.endSelection();
      this.render();
    }
    this.stopAutoScroll();
  }

  autoScrollIfNeeded(e) {
    const EDGE_SIZE = 20;
    const scrollSpeed = 15; // Reduced for smoother autoscroll
    const rect = this.mainGridCanvas.getBoundingClientRect();
    let dx = 0, dy = 0;
    
    const maxScrollX = this.getMaxScrollX();
    const maxScrollY = this.getMaxScrollY();
    
    // Check all edges for autoscroll with proper bounds checking
    if (e.clientX - rect.left < EDGE_SIZE && this.scrollX > 0) {
      dx = -scrollSpeed;
    } else if (rect.right - e.clientX < EDGE_SIZE && this.scrollX < maxScrollX) {
      dx = scrollSpeed;
    }
    
    if (e.clientY - rect.top < EDGE_SIZE && this.scrollY > 0) {
      dy = -scrollSpeed;
    } else if (rect.bottom - e.clientY < EDGE_SIZE && this.scrollY < maxScrollY) {
      dy = scrollSpeed;
    }
    
    if (dx !== 0 || dy !== 0) {
      this.autoScrollDirection = { dx, dy };
      if (!this.autoScrollRAF) this.autoScrollStep();
    } else {
      this.stopAutoScroll();
    }
  }

  autoScrollStep() {
    if (!this.autoScrollDirection) return;
    const { dx, dy } = this.autoScrollDirection;
    
    const maxScrollX = this.getMaxScrollX();
    const maxScrollY = this.getMaxScrollY();
    
    // Apply scroll with proper bounds
    this.scrollX = Math.max(0, Math.min(maxScrollX, this.scrollX + dx));
    this.scrollY = Math.max(0, Math.min(maxScrollY, this.scrollY + dy));
    
    this.render();
    this.scrollbar.updateScrollbars();
    
    // Update selection if pointer is still active
    if (this.lastPointerEvent) {
      const { row, col } = this.getCellFromClientCoords(this.lastPointerEvent.clientX, this.lastPointerEvent.clientY);
      if (this.isValidCell(row, col)) {
        this.selection.updateSelection(row, col);
        this.render();
      }
    }
    
    this.autoScrollRAF = requestAnimationFrame(() => this.autoScrollStep());
  }

  stopAutoScroll() {
    if (this.autoScrollRAF) {
      cancelAnimationFrame(this.autoScrollRAF);
      this.autoScrollRAF = null;
    }
    this.autoScrollDirection = null;
  }

  resize() {
    this.viewportWidth = this.container.clientWidth;
    this.viewportHeight = this.container.clientHeight;

    const gridWidth = this.viewportWidth - this.HEADER_WIDTH - 17;
    const gridHeight = this.viewportHeight - this.HEADER_HEIGHT - 17;

    this.visibleCols = Math.ceil(gridWidth / this.CELL_WIDTH);
    this.visibleRows = Math.ceil(gridHeight / this.CELL_HEIGHT);

    this.colHeaderCanvas.width = gridWidth;
    this.colHeaderCanvas.height = this.HEADER_HEIGHT;

    this.rowHeaderCanvas.width = this.HEADER_WIDTH;
    this.rowHeaderCanvas.height = gridHeight;

    this.mainGridCanvas.width = gridWidth;
    this.mainGridCanvas.height = gridHeight;

    this.render();
    if (this.scrollbar) {
      this.scrollbar.updateScrollbars();
    }
  }

  getCellFromClientCoords(clientX, clientY) {
    const rect = this.mainGridCanvas.getBoundingClientRect();
    const x = clientX - rect.left + this.scrollX;
    const y = clientY - rect.top + this.scrollY;

    let col = 0, xOffset = 0;
    while (xOffset < x && col < this.totalCols) {
      const colWidth = this.resizer?.colSizes.get(col) ?? this.CELL_WIDTH;
      if (xOffset + colWidth > x) break;
      xOffset += colWidth;
      col++;
    }

    let row = 0, yOffset = 0;
    while (yOffset < y && row < this.totalRows) {
      const rowHeight = this.resizer?.rowSizes.get(row) ?? this.CELL_HEIGHT;
      if (yOffset + rowHeight > y) break;
      yOffset += rowHeight;
      row++;
    }

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
    
    // Fill header background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.colHeaderCanvas.width, this.HEADER_HEIGHT);
    
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();

    let xOffset = 0;
    for (let col = 0; col < this.totalCols && xOffset - this.scrollX < this.mainGridCanvas.width; col++) {
      const colWidth = this.resizer?.colSizes.get(col) ?? this.CELL_WIDTH;
      const x = xOffset - this.scrollX;

      if (x + colWidth > 0) {
        // Highlight selected column header
        if (this.selection.isColumnSelected(col)) {
          ctx.fillStyle = 'green';
          ctx.fillRect(x, 0, colWidth, this.HEADER_HEIGHT);
          ctx.fillStyle = '#000';
        }

        // Text
        ctx.fillText(this.getColumnName(col), x + colWidth / 2, this.HEADER_HEIGHT / 2);

        // Vertical line
        ctx.moveTo(x + colWidth + 0.5, 0);
        ctx.lineTo(x + colWidth + 0.5, this.HEADER_HEIGHT);
      }

      xOffset += colWidth;
    }

    // Bottom border
    ctx.moveTo(0, this.HEADER_HEIGHT - 0.5);
    ctx.lineTo(this.colHeaderCanvas.width, this.HEADER_HEIGHT - 0.5);

    ctx.stroke();
  }

  drawRowHeaders() {
    const ctx = this.ctxRowHeader;
    ctx.clearRect(0, 0, this.rowHeaderCanvas.width, this.rowHeaderCanvas.height);
    
    // Fill header background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.HEADER_WIDTH, this.rowHeaderCanvas.height);
    
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();

    let yOffset = 0;
    for (let row = 0; row < this.totalRows && yOffset - this.scrollY < this.mainGridCanvas.height; row++) {
      const rowHeight = this.resizer?.rowSizes.get(row) ?? this.CELL_HEIGHT;
      const y = yOffset - this.scrollY;

      if (y + rowHeight > 0) {
        // Highlight selected row header
        if (this.selection.isRowSelected(row)) {
          ctx.fillStyle = 'rgba(32, 151, 79, 0.5)';
          ctx.fillRect(0, y, this.HEADER_WIDTH, rowHeight);
          ctx.fillStyle = '#000';
        }

        // Text
        ctx.fillText(row + 1, this.HEADER_WIDTH / 2, y + rowHeight / 2);

        // Horizontal line
        ctx.moveTo(0, y + rowHeight + 0.5);
        ctx.lineTo(this.HEADER_WIDTH, y + rowHeight + 0.5);
      }

      yOffset += rowHeight;
    }

    // Right border
    ctx.moveTo(this.HEADER_WIDTH - 0.5, 0);
    ctx.lineTo(this.HEADER_WIDTH - 0.5, this.rowHeaderCanvas.height);

    ctx.stroke();
  }

  drawMainGrid() {
    const ctx = this.ctxMainGrid;
    ctx.clearRect(0, 0, this.mainGridCanvas.width, this.mainGridCanvas.height);

    ctx.strokeStyle = '#e0e0e0';
    ctx.beginPath();

    let xOffset = 0;
    for (let col = 0; col < this.totalCols && xOffset - this.scrollX < this.mainGridCanvas.width; col++) {
      const colWidth = this.resizer?.colSizes.get(col) ?? this.CELL_WIDTH;
      const x = xOffset - this.scrollX;
      if (x + colWidth > 0) {
        ctx.moveTo(x + colWidth + 0.5, 0);
        ctx.lineTo(x + colWidth + 0.5, this.mainGridCanvas.height);
      }
      xOffset += colWidth;
    }

    let yOffset = 0;
    for (let row = 0; row < this.totalRows && yOffset - this.scrollY < this.mainGridCanvas.height; row++) {
      const rowHeight = this.resizer?.rowSizes.get(row) ?? this.CELL_HEIGHT;
      const y = yOffset - this.scrollY;
      if (y + rowHeight > 0) {
        ctx.moveTo(0, y + rowHeight + 0.5);
        ctx.lineTo(this.mainGridCanvas.width, y + rowHeight + 0.5);
      }
      yOffset += rowHeight;
    }

    ctx.stroke();
    this.selection.renderSelection(ctx);
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