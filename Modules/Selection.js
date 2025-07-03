export class Selection {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.active = false;
    this.startRow = null;
    this.startCol = null;
    this.endRow = null;
    this.endCol = null;
    this.selectionType = 'cell'; // 'cell', 'row', 'column'
    this.selectedRow = null;
    this.selectedCol = null;
  }

  startSelection(row, col) {
    this.active = true;
    this.startRow = row;
    this.startCol = col;
    this.endRow = row;
    this.endCol = col;
    this.selectionType = 'cell';
    this.selectedRow = null;
    this.selectedCol = null;
  }

  updateSelection(row, col) {
    if (this.active && this.selectionType === 'cell') {
      this.endRow = row;
      this.endCol = col;
    }
  }

  endSelection() {
    this.active = false;
  }

  selectRow(row) {
    this.selectionType = 'row';
    this.selectedRow = row;
    this.selectedCol = null;
    this.startRow = row;
    this.startCol = 0;
    this.endRow = row;
    this.endCol = this.canvasManager.totalCols - 1;
    this.active = false;
  }

  selectColumn(col) {
    this.selectionType = 'column';
    this.selectedCol = col;
    this.selectedRow = null;
    this.startRow = 0;
    this.startCol = col;
    this.endRow = this.canvasManager.totalRows - 1;
    this.endCol = col;
    this.active = false;
  }

  isRowSelected(row) {
    return this.selectionType === 'row' && this.selectedRow === row;
  }

  isColumnSelected(col) {
    return this.selectionType === 'column' && this.selectedCol === col;
  }

  hasSelection() {
    return (
      this.startRow !== null &&
      this.startCol !== null &&
      this.endRow !== null &&
      this.endCol !== null
    );
  }

  selectCell(row, col) {
    this.startSelection(row, col);
    this.updateSelection(row, col);
    this.endSelection();
  }

  renderSelection(ctx) {
    if (!this.hasSelection()) return;

    const {
      scrollX,
      scrollY,
      totalRows,
      totalCols,
    } = this.canvasManager;

    const minRow = Math.max(0, Math.min(this.startRow, this.endRow));
    const maxRow = Math.min(totalRows - 1, Math.max(this.startRow, this.endRow));
    const minCol = Math.max(0, Math.min(this.startCol, this.endCol));
    const maxCol = Math.min(totalCols - 1, Math.max(this.startCol, this.endCol));

    ctx.save();

    // For row/column selections, render the entire visible area
    if (this.selectionType === 'row' || this.selectionType === 'column') {
      this.renderFullRowColumnSelection(ctx, minRow, maxRow, minCol, maxCol);
    } else {
      this.renderCellSelection(ctx, minRow, maxRow, minCol, maxCol);
    }

    ctx.restore();
  }

  renderFullRowColumnSelection(ctx, minRow, maxRow, minCol, maxCol) {
    const { scrollX, scrollY } = this.canvasManager;

    // Calculate visible area bounds
    const visibleStartCol = Math.floor(scrollX / this.canvasManager.CELL_WIDTH);
    const visibleEndCol = Math.min(
      this.canvasManager.totalCols - 1,
      visibleStartCol + this.canvasManager.visibleCols + 1
    );
    
    const visibleStartRow = Math.floor(scrollY / this.canvasManager.CELL_HEIGHT);
    const visibleEndRow = Math.min(
      this.canvasManager.totalRows - 1,
      visibleStartRow + this.canvasManager.visibleRows + 1
    );

    // Adjust selection bounds for visibility
    const renderMinCol = this.selectionType === 'column' ? minCol : visibleStartCol;
    const renderMaxCol = this.selectionType === 'column' ? maxCol : visibleEndCol;
    const renderMinRow = this.selectionType === 'row' ? minRow : visibleStartRow;
    const renderMaxRow = this.selectionType === 'row' ? maxRow : visibleEndRow;

    // Fill background for all visible cells in selection
    for (let row = renderMinRow; row <= renderMaxRow; row++) {
      for (let col = renderMinCol; col <= renderMaxCol; col++) {
        let x = 0, y = 0;
        let width = this.canvasManager.resizer?.colSizes.get(col) ?? this.canvasManager.CELL_WIDTH;
        let height = this.canvasManager.resizer?.rowSizes.get(row) ?? this.canvasManager.CELL_HEIGHT;

        // Calculate x position
        let xOffset = 0;
        for (let c = 0; c < col; c++) {
          xOffset += this.canvasManager.resizer?.colSizes.get(c) ?? this.canvasManager.CELL_WIDTH;
        }
        x = xOffset - scrollX;

        // Calculate y position
        let yOffset = 0;
        for (let r = 0; r < row; r++) {
          yOffset += this.canvasManager.resizer?.rowSizes.get(r) ?? this.canvasManager.CELL_HEIGHT;
        }
        y = yOffset - scrollY;

        // Only render if cell is visible
        if (x + width > 0 && x < this.canvasManager.mainGridCanvas.width &&
            y + height > 0 && y < this.canvasManager.mainGridCanvas.height) {
          ctx.fillStyle = 'rgba(232, 242, 236, 0.5)';
          ctx.fillRect(x, y, width, height);
        }
      }
    }

    // Draw border around the selection
    this.drawSelectionBorder(ctx, renderMinRow, renderMaxRow, renderMinCol, renderMaxCol);
  }

  renderCellSelection(ctx, minRow, maxRow, minCol, maxCol) {
    const { scrollX, scrollY } = this.canvasManager;

    // Calculate positions for all cells in selection
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        // Skip the starting cell (anchor cell)
        if (row === this.startRow && col === this.startCol) continue;

        let x = 0, y = 0;
        let width = this.canvasManager.resizer?.colSizes.get(col) ?? this.canvasManager.CELL_WIDTH;
        let height = this.canvasManager.resizer?.rowSizes.get(row) ?? this.canvasManager.CELL_HEIGHT;

        // Calculate x position
        let xOffset = 0;
        for (let c = 0; c < col; c++) {
          xOffset += this.canvasManager.resizer?.colSizes.get(c) ?? this.canvasManager.CELL_WIDTH;
        }
        x = xOffset - scrollX;

        // Calculate y position
        let yOffset = 0;
        for (let r = 0; r < row; r++) {
          yOffset += this.canvasManager.resizer?.rowSizes.get(r) ?? this.canvasManager.CELL_HEIGHT;
        }
        y = yOffset - scrollY;

        // Fill background for selected cell
        ctx.fillStyle = 'rgba(232, 242, 236, 0.5)';
        ctx.fillRect(x, y, width, height);
      }
    }

    // Draw border around entire selection
    this.drawSelectionBorder(ctx, minRow, maxRow, minCol, maxCol);
  }

  drawSelectionBorder(ctx, minRow, maxRow, minCol, maxCol) {
    const { scrollX, scrollY } = this.canvasManager;
    
    let selectionX = 0, selectionY = 0, selectionWidth = 0, selectionHeight = 0;

    // Calculate selection bounds
    let xOffset = 0;
    for (let col = 0; col <= maxCol; col++) {
      const colWidth = this.canvasManager.resizer?.colSizes.get(col) ?? this.canvasManager.CELL_WIDTH;
      if (col === minCol) {
        selectionX = xOffset - scrollX;
      }
      if (col >= minCol && col <= maxCol) {
        selectionWidth += colWidth;
      }
      xOffset += colWidth;
    }

    let yOffset = 0;
    for (let row = 0; row <= maxRow; row++) {
      const rowHeight = this.canvasManager.resizer?.rowSizes.get(row) ?? this.canvasManager.CELL_HEIGHT;
      if (row === minRow) {
        selectionY = yOffset - scrollY;
      }
      if (row >= minRow && row <= maxRow) {
        selectionHeight += rowHeight;
      }
      yOffset += rowHeight;
    }

    // For full row/column selections, extend to canvas edges
    if (this.selectionType === 'row') {
      selectionX = 0;
      selectionWidth = this.canvasManager.mainGridCanvas.width;
    } else if (this.selectionType === 'column') {
      selectionY = 0;
      selectionHeight = this.canvasManager.mainGridCanvas.height;
    }

    // Draw selection border
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;
    ctx.strokeRect(selectionX, selectionY, selectionWidth, selectionHeight);
  }
}