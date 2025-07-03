export class Resizer {
  constructor(canvasManager) {
    this.cm = canvasManager;
    this.colSizes = new Map();
    this.rowSizes = new Map();
    this.activeResize = null;

    this.initEvents();
  }

  initEvents() {
    this.cm.colHeaderCanvas.addEventListener('pointerdown', e => this.handlePointerDown(e, 'col'));
    this.cm.rowHeaderCanvas.addEventListener('pointerdown', e => this.handlePointerDown(e, 'row'));
    
    // Add cursor change for resize zones
    this.cm.colHeaderCanvas.addEventListener('pointermove', e => this.updateCursor(e, 'col'));
    this.cm.rowHeaderCanvas.addEventListener('pointermove', e => this.updateCursor(e, 'row'));
  }

  isResizeZone(e, type) {
    const canvas = type === 'col' ? this.cm.colHeaderCanvas : this.cm.rowHeaderCanvas;
    const rect = canvas.getBoundingClientRect();
    
    if (type === 'col') {
      const offsetX = e.clientX - rect.left + this.cm.scrollX;
      let xOffset = 0;
      
      for (let col = 0; col < this.cm.totalCols; col++) {
        const colWidth = this.colSizes.get(col) ?? this.cm.CELL_WIDTH;
        const nextXOffset = xOffset + colWidth;
        
        if (offsetX >= xOffset && offsetX <= nextXOffset) {
          return Math.abs(offsetX - nextXOffset) <= 6;
        }
        xOffset = nextXOffset;
      }
    } else {
      const offsetY = e.clientY - rect.top + this.cm.scrollY;
      let yOffset = 0;
      
      for (let row = 0; row < this.cm.totalRows; row++) {
        const rowHeight = this.rowSizes.get(row) ?? this.cm.CELL_HEIGHT;
        const nextYOffset = yOffset + rowHeight;
        
        if (offsetY >= yOffset && offsetY <= nextYOffset) {
          return Math.abs(offsetY - nextYOffset) <= 6;
        }
        yOffset = nextYOffset;
      }
    }
    return false;
  }

  updateCursor(e, type) {
    const canvas = type === 'col' ? this.cm.colHeaderCanvas : this.cm.rowHeaderCanvas;
    const rect = canvas.getBoundingClientRect();
    
    if (type === 'col') {
      const offsetX = e.clientX - rect.left + this.cm.scrollX;
      let xOffset = 0;
      
      for (let col = 0; col < this.cm.totalCols; col++) {
        const colWidth = this.colSizes.get(col) ?? this.cm.CELL_WIDTH;
        const nextXOffset = xOffset + colWidth;
        
        if (offsetX >= xOffset && offsetX <= nextXOffset) {
          if (Math.abs(offsetX - nextXOffset) <= 6) {
            canvas.style.cursor = 'col-resize';
            return;
          }
          break;
        }
        xOffset = nextXOffset;
      }
      canvas.style.cursor = 'default';
    } else {
      const offsetY = e.clientY - rect.top + this.cm.scrollY;
      let yOffset = 0;
      
      for (let row = 0; row < this.cm.totalRows; row++) {
        const rowHeight = this.rowSizes.get(row) ?? this.cm.CELL_HEIGHT;
        const nextYOffset = yOffset + rowHeight;
        
        if (offsetY >= yOffset && offsetY <= nextYOffset) {
          if (Math.abs(offsetY - nextYOffset) <= 6) {
            canvas.style.cursor = 'row-resize';
            return;
          }
          break;
        }
        yOffset = nextYOffset;
      }
      canvas.style.cursor = 'default';
    }
  }

  handlePointerDown(e, type) {
    // Only handle if this is actually a resize zone
    if (!this.isResizeZone(e, type)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    const canvas = type === 'col' ? this.cm.colHeaderCanvas : this.cm.rowHeaderCanvas;
    const rect = canvas.getBoundingClientRect();
    
    if (type === 'col') {
      const offsetX = e.clientX - rect.left + this.cm.scrollX;
      let xOffset = 0;
      
      for (let col = 0; col < this.cm.totalCols; col++) {
        const colWidth = this.colSizes.get(col) ?? this.cm.CELL_WIDTH;
        const nextXOffset = xOffset + colWidth;
        
        // Check if we're near the right edge of this column (resize zone)
        if (offsetX >= xOffset && offsetX <= nextXOffset) {
          if (Math.abs(offsetX - nextXOffset) <= 6) {
            this.startResize(canvas, e, type, col);
            return;
          }
          break;
        }
        xOffset = nextXOffset;
      }
    } else {
      const offsetY = e.clientY - rect.top + this.cm.scrollY;
      let yOffset = 0;
      
      for (let row = 0; row < this.cm.totalRows; row++) {
        const rowHeight = this.rowSizes.get(row) ?? this.cm.CELL_HEIGHT;
        const nextYOffset = yOffset + rowHeight;
        
        // Check if we're near the bottom edge of this row (resize zone)
        if (offsetY >= yOffset && offsetY <= nextYOffset) {
          if (Math.abs(offsetY - nextYOffset) <= 6) {
            this.startResize(canvas, e, type, row);
            return;
          }
          break;
        }
        yOffset = nextYOffset;
      }
    }
  }

  startResize(canvas, e, type, index) {
    canvas.setPointerCapture(e.pointerId);
    
    this.activeResize = {
      type,
      index,
      startX: e.clientX,
      startY: e.clientY,
      canvas
    };

    const handlePointerMove = (e) => {
      if (!this.activeResize) return;
      
      const delta = type === 'col' ? e.clientX - this.activeResize.startX : e.clientY - this.activeResize.startY;
      const sizes = type === 'col' ? this.colSizes : this.rowSizes;
      const oldSize = sizes.get(index) ?? (type === 'col' ? this.cm.CELL_WIDTH : this.cm.CELL_HEIGHT);
      const newSize = Math.max(20, oldSize + delta);
      
      sizes.set(index, newSize);
      this.activeResize.startX = e.clientX;
      this.activeResize.startY = e.clientY;
      this.cm.render();
    };

    const handlePointerUp = (e) => {
      if (this.activeResize) {
        canvas.releasePointerCapture(e.pointerId);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        this.activeResize = null;
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
  }
}