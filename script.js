const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");

const cellWidth = 100;
const cellHeight = 30;
const headerHeight = 30;
const headerWidth = 50;

const totalCols = 1000;
const totalRows = 1000;

let scrollX = 0;
let scrollY = 0;
let selectedCell = null;

// Utility: Convert number to Excel column letters
function getColumnLetter(n) {
  let result = "";
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

// Draw Grid
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const visibleCols = Math.floor((canvas.width - headerWidth) / cellWidth);
  const visibleRows = Math.floor((canvas.height - headerHeight) / cellHeight);

  const startCol = Math.floor(scrollX / cellWidth);
  const startRow = Math.floor(scrollY / cellHeight);

  const offsetX = scrollX % cellWidth;
  const offsetY = scrollY % cellHeight;

  // Column Headers
  for (let c = 0; c <= visibleCols; c++) {
    const colIndex = startCol + c;
    const x = headerWidth + c * cellWidth - offsetX;
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x, 0, cellWidth, headerHeight);
    ctx.strokeRect(x, 0, cellWidth, headerHeight);
    ctx.fillStyle = "black";
    ctx.fillText(getColumnLetter(colIndex), x + 5, 20);
  }

  // Row Headers
  for (let r = 0; r <= visibleRows; r++) {
    const rowIndex = startRow + r;
    const y = headerHeight + r * cellHeight - offsetY;
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, y, headerWidth, cellHeight);
    ctx.strokeRect(0, y, headerWidth, cellHeight);
    ctx.fillStyle = "black";
    ctx.fillText(rowIndex + 1, 5, y + 20);
  }

  // Cells
  for (let r = 0; r <= visibleRows; r++) {
    for (let c = 0; c <= visibleCols; c++) {
      const x = headerWidth + c * cellWidth - offsetX;
      const y = headerHeight + r * cellHeight - offsetY;
      ctx.fillStyle = "white";
      ctx.fillRect(x, y, cellWidth, cellHeight);
      ctx.strokeStyle = "#ddd";
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // Highlight selected cell
      const absRow = startRow + r;
      const absCol = startCol + c;
      if (selectedCell &&
          selectedCell.row === absRow &&
          selectedCell.col === absCol) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        ctx.lineWidth = 1;
      }
    }
  }
}

// Mouse Click to Select Cell
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - headerWidth + scrollX;
  const y = e.clientY - rect.top - headerHeight + scrollY;

  const col = Math.floor(x / cellWidth);
  const row = Math.floor(y / cellHeight);

  if (col >= 0 && row >= 0) {
    selectedCell = { row, col };
    drawGrid();
  }
});

// Scroll with Wheel
canvas.addEventListener("wheel", (e) => {
  scrollX += e.deltaX;
  scrollY += e.deltaY;

  scrollX = Math.max(0, Math.min(scrollX, totalCols * cellWidth - canvas.width));
  scrollY = Math.max(0, Math.min(scrollY, totalRows * cellHeight - canvas.height));

  drawGrid();
});

// Initial Draw
drawGrid();
