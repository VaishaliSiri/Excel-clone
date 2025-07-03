export class KeyboardNavigator {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;

    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
  const cm = this.canvasManager;
  const selection = cm.selection;

  // Initialize selection if none exists
  if (!selection.hasSelection()) {
    selection.selectCell(0, 0);
    cm.render();
  }

  const { startRow: currentRow, startCol: currentCol } = selection;

  let newRow = currentRow;
  let newCol = currentCol;

  switch (e.key) {
    case 'ArrowUp':
      newRow = Math.max(0, currentRow - 1);
      e.preventDefault();
      break;
    case 'ArrowDown':
      newRow = Math.min(cm.totalRows - 1, currentRow + 1);
      e.preventDefault();
      break;
    case 'ArrowLeft':
      newCol = Math.max(0, currentCol - 1);
      e.preventDefault();
      break;
    case 'ArrowRight':
      newCol = Math.min(cm.totalCols - 1, currentCol + 1);
      e.preventDefault();
      break;
    default:
      return; // No action needed
  }

  // Only update if position changed
  if (newRow !== currentRow || newCol !== currentCol) {
    selection.selectCell(newCol, newRow); // Note: You had `.selectCell(row, col)` swapped before
    this.scrollToCell(newRow, newCol);
    cm.render();
  }
}
  scrollToCell(row, col) {
  const cm = this.canvasManager;

  // Calculate absolute pixel position of the cell
  let xOffset = 0;
  for (let c = 0; c < col; c++) {
    xOffset += cm.resizer?.colSizes.get(c) ?? cm.CELL_WIDTH;
  }

  let yOffset = 0;
  for (let r = 0; r < row; r++) {
    yOffset += cm.resizer?.rowSizes.get(r) ?? cm.CELL_HEIGHT;
  }

  const cellWidth = cm.resizer?.colSizes.get(col) ?? cm.CELL_WIDTH;
  const cellHeight = cm.resizer?.rowSizes.get(row) ?? cm.CELL_HEIGHT;

  // Horizontal scroll
  if (xOffset < cm.scrollX) {
    cm.scrollX = xOffset;
  } else if (xOffset + cellWidth > cm.scrollX + cm.mainGridCanvas.width) {
    cm.scrollX = xOffset + cellWidth - cm.mainGridCanvas.width;
  }

  // Vertical scroll
  if (yOffset < cm.scrollY) {
    cm.scrollY = yOffset;
  } else if (yOffset + cellHeight > cm.scrollY + cm.mainGridCanvas.height) {
    cm.scrollY = yOffset + cellHeight - cm.mainGridCanvas.height;
  }

  // Clamp to valid scroll range
  cm.scrollX = Math.max(0, Math.min(cm.getMaxScrollX(), cm.scrollX));
  cm.scrollY = Math.max(0, Math.min(cm.getMaxScrollY(), cm.scrollY));

  cm.scrollbar.updateScrollbars();
}
}