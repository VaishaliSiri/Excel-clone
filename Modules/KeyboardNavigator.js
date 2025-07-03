export class KeyboardNavigator {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.selection = canvasManager.selection;

    this.attachEvents();
  }

  attachEvents() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  onKeyDown(e) {
    const sel = this.selection;
    if (!sel.anchor) return;

    const { row, col } = sel.anchor;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(this.canvasManager.totalRows - 1, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(this.canvasManager.totalCols - 1, col + 1);
        break;
      case 'Enter':
        newRow = Math.min(this.canvasManager.totalRows - 1, row + 1);
        break;
      case 'Tab':
        e.preventDefault(); // Avoid browser focus shift
        newCol = Math.min(this.canvasManager.totalCols - 1, col + 1);
        break;
      default:
        return; // Do nothing for other keys
    }

    // Update selection and re-render
    sel.startSelection(newRow, newCol);
    this.canvasManager.scrollToCell(newRow, newCol);
    this.canvasManager.render();
  }
}
