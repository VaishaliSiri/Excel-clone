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

  getNormalizedRange() {
    const minRow = Math.min(this.startRow, this.endRow);
    const maxRow = Math.max(this.startRow, this.endRow);
    const minCol = Math.min(this.startCol, this.endCol);
    const maxCol = Math.max(this.startCol, this.endCol);
    return { minRow, maxRow, minCol, maxCol };
  }

  selectCell(row, col) {
    this.startSelection(row, col);
    this.updateSelection(row, col);
    this.endSelection();
  }

  renderSelection(ctx) {
    if (!this.hasSelection()) return;

    const { CELL_WIDTH, CELL_HEIGHT, scrollX, scrollY } = this.canvasManager;
    const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange();

    const x = minCol * CELL_WIDTH - scrollX + 0.5;
    const y = minRow * CELL_HEIGHT - scrollY + 0.5;
    const w = (maxCol - minCol + 1) * CELL_WIDTH;
    const h = (maxRow - minRow + 1) * CELL_HEIGHT;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // fill
    ctx.strokeStyle = '#00a000'; // border
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
}
