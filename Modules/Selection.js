export class Selection {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.active = false;
    this.startRow = null;
    this.startCol = null;
    this.endRow = null;
    this.endCol = null;
  }

  startSelection(row, col) {
    this.active = true;
    this.startRow = row;
    this.startCol = col;
    this.endRow = row;
    this.endCol = col;
  }

  updateSelection(row, col) {
    if (this.active) {
      this.endRow = row;
      this.endCol = col;
    }
  }

  endSelection() {
    this.active = false;
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
      CELL_WIDTH: cellWidth,
      CELL_HEIGHT: cellHeight,
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

    // Fill background for selected cells (except anchor cell)
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row === this.startRow && col === this.startCol) continue;

        const x = col * cellWidth - scrollX;
        const y = row * cellHeight - scrollY;

        ctx.fillStyle = 'rgb(232,242,236,0.5)';
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    }

    // Draw outer border for entire selection
    const borderX = minCol * cellWidth - scrollX + 0.5;
    const borderY = minRow * cellHeight - scrollY + 0.5;
    const borderW = (maxCol - minCol + 1) * cellWidth - 1;
    const borderH = (maxRow - minRow + 1) * cellHeight - 1;

    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.strokeRect(borderX, borderY, borderW, borderH);

    ctx.restore();
  }
}
