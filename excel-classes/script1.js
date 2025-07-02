// === Dynamic DOM creation ===
const container = document.createElement("div");
container.id = "container";
container.style.position = "relative";
container.style.width = "100vw";
container.style.height = "100vh";

// Corner Header
const cornerHeader = document.createElement("div");
cornerHeader.id = "corner-header";
cornerHeader.style.position = "fixed";
cornerHeader.style.top = "0";
cornerHeader.style.left = "0";
cornerHeader.style.width = "50px";
cornerHeader.style.height = "30px";
cornerHeader.style.background = "#f0f0f0";
cornerHeader.style.borderRight = "1px solid #999";
cornerHeader.style.borderBottom = "1px solid #999";
cornerHeader.style.zIndex = "20";

// Column Header
const columnHeader = document.createElement("div");
columnHeader.id = "column-header";
columnHeader.style.position = "fixed";
columnHeader.style.top = "0";
columnHeader.style.left = "50px";
columnHeader.style.right = "0";
columnHeader.style.height = "30px";
columnHeader.style.background = "#f0f0f0";
columnHeader.style.borderBottom = "1px solid #999";
columnHeader.style.zIndex = "10";
columnHeader.style.overflow = "hidden";

const columnCanvas = document.createElement("canvas");
columnCanvas.id = "column-canvas";
columnCanvas.className = "header-canvas";
columnCanvas.style.display = "block";
columnHeader.appendChild(columnCanvas);

// Row Header
const rowHeader = document.createElement("div");
rowHeader.id = "row-header";
rowHeader.style.position = "fixed";
rowHeader.style.top = "30px";
rowHeader.style.left = "0";
rowHeader.style.bottom = "0";
rowHeader.style.width = "50px";
rowHeader.style.background = "#f0f0f0";
rowHeader.style.borderRight = "1px solid #999";
rowHeader.style.zIndex = "10";
rowHeader.style.overflow = "hidden";

const rowCanvas = document.createElement("canvas");
rowCanvas.id = "row-canvas";
rowCanvas.className = "header-canvas";
rowCanvas.style.display = "block";
rowHeader.appendChild(rowCanvas);

// Grid container
const gridContainer = document.createElement("div");
gridContainer.id = "grid-container";
gridContainer.style.position = "absolute";
gridContainer.style.top = "30px";
gridContainer.style.left = "50px";
gridContainer.style.right = "0";
gridContainer.style.bottom = "0";
gridContainer.style.overflow = "auto";
gridContainer.style.backgroundColor = "#fff";
gridContainer.style.zIndex = "0";

// Grid content
const gridContent = document.createElement("div");
gridContent.id = "grid-content";
gridContent.style.position = "relative";
gridContent.style.width = "50000px"; // totalCols * cellWidth
gridContent.style.height = "3000000px"; // totalRows * cellHeight

// Grid canvas
const gridCanvas = document.createElement("canvas");
gridCanvas.id = "grid";
gridCanvas.style.position = "absolute";
gridCanvas.style.top = "0px";
gridCanvas.style.left = "0px";
gridCanvas.style.cursor = "cell";
gridContent.appendChild(gridCanvas);
gridContainer.appendChild(gridContent);

// Cell input
const cellInput = document.createElement("input");
cellInput.type = "text";
cellInput.id = "text-field";
cellInput.className = "input_cell";
cellInput.style.position = "absolute";
cellInput.style.display = "none";
cellInput.style.fontSize = "14px";
cellInput.style.border = "1px solid #4CAF50";
cellInput.style.outline = "none";
cellInput.style.padding = "4px";
cellInput.style.zIndex = "50";
cellInput.style.boxSizing = "border-box";

// Append all to container
container.appendChild(cornerHeader);
container.appendChild(columnHeader);
container.appendChild(rowHeader);
container.appendChild(gridContainer);
container.appendChild(cellInput);

// Append container to body
document.body.appendChild(container);

        const data = {};
        
        const gridCtx = gridCanvas.getContext("2d");
        const columnCtx = columnCanvas.getContext("2d");
        const rowCtx = rowCanvas.getContext("2d");

        const cellWidth = 100;
        const cellHeight = 30;
        const headerHeight = 30;
        const headerWidth = 50;

        const totalCols = 500;
        const totalRows = 100000;

        let selectedCell = null;
        let lastScrollLeft = 0;
        let lastScrollTop = 0;

        let selectionStart = null;
        let selectionEnd = null;
        let isSelecting = false;
        let editingCell = null;

        // Set canvas sizes
        function resizeCanvases() {
            // Grid canvas - make it large enough for virtual scrolling
            gridCanvas.width = window.innerWidth;
            gridCanvas.height = window.innerHeight;
            
            // Column header canvas
            columnCanvas.width = window.innerWidth - headerWidth;
            columnCanvas.height = headerHeight;
            
            // Row header canvas  
            rowCanvas.width = headerWidth;
            rowCanvas.height = window.innerHeight - headerHeight;
            
            drawAll();
        }

        // Initial resize
        resizeCanvases();
        window.addEventListener('resize', resizeCanvases);

        // Utility: Convert number to Excel column letters
        function getColumnLetter(n) {
            let result = "";
            while (n >= 0) {
                result = String.fromCharCode((n % 26) + 65) + result;
                n = Math.floor(n / 26) - 1;
            }
            return result;
        }

        // Draw main grid
        function drawGrid() {
            const scrollLeft = gridContainer.scrollLeft;
            const scrollTop = gridContainer.scrollTop;
            
            gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

            const visibleCols = Math.ceil(gridCanvas.width / cellWidth) + 2;
            const visibleRows = Math.ceil(gridCanvas.height / cellHeight) + 2;

            const startCol = Math.floor(scrollLeft / cellWidth);
            const startRow = Math.floor(scrollTop / cellHeight);

            const offsetX = -(scrollLeft % cellWidth);
            const offsetY = -(scrollTop % cellHeight);

            // Calculate the actual range to draw (limited by totalCols and totalRows)
            const endCol = Math.min(startCol + visibleCols, totalCols);
            const endRow = Math.min(startRow + visibleRows, totalRows);
            
            // Only draw cells that are within our grid limits
            const actualVisibleCols = endCol - startCol;
            const actualVisibleRows = endRow - startRow;

            // Draw cell backgrounds and selection highlights
            for (let r = 0; r < actualVisibleRows; r++) {
                for (let c = 0; c < actualVisibleCols; c++) {
                    const rowIndex = startRow + r;
                    const colIndex = startCol + c;
                    
                    // Skip if outside bounds
                    if (rowIndex >= totalRows || colIndex >= totalCols) continue;
                    
                    const x = c * cellWidth + offsetX;
                    const y = r * cellHeight + offsetY;
                    
                    // Check if this cell is in the selection
                    let isSelected = false;
                    if (selectionStart && selectionEnd) {
                        const minRow = Math.min(selectionStart.row, selectionEnd.row);
                        const maxRow = Math.max(selectionStart.row, selectionEnd.row);
                        const minCol = Math.min(selectionStart.col, selectionEnd.col);
                        const maxCol = Math.max(selectionStart.col, selectionEnd.col);
                        
                        if (rowIndex >= minRow && rowIndex <= maxRow && 
                            colIndex >= minCol && colIndex <= maxCol) {
                            isSelected = true;
                        }
                    }
                    
                    // Draw cell background
                    if (isSelected && !(rowIndex === selectionStart.row && colIndex === selectionStart.col)) {
                        // Selected cells (except the first one) get light green background
                        gridCtx.fillStyle = "#E7F2ED";
                    } else {
                        // Normal cells get white background
                        gridCtx.fillStyle = "white";
                    }
                    gridCtx.fillRect(x, y, cellWidth, cellHeight);
                }
            }

            // Draw grid lines (only for cells within limits)
            gridCtx.strokeStyle = "#ddd";
            gridCtx.lineWidth = 0.5;
            
            // Vertical lines - only draw up to the actual column limit
            for (let c = 0; c <= actualVisibleCols; c++) {
                const colIndex = startCol + c;
                if (colIndex > totalCols) break;
                
                const x = c * cellWidth + offsetX + 0.5;
                gridCtx.beginPath();
                gridCtx.moveTo(x, 0);
                gridCtx.lineTo(x, Math.min(gridCanvas.height, actualVisibleRows * cellHeight + offsetY));
                gridCtx.stroke();
            }

            // Horizontal lines - only draw up to the actual row limit
            for (let r = 0; r <= actualVisibleRows; r++) {
                const rowIndex = startRow + r;
                if (rowIndex > totalRows) break;
                
                const y = r * cellHeight + offsetY + 0.5;
                gridCtx.beginPath();
                gridCtx.moveTo(0, y);
                gridCtx.lineTo(Math.min(gridCanvas.width, actualVisibleCols * cellWidth + offsetX), y);
                gridCtx.stroke();
            }

            // Draw cell content (text) - this comes AFTER backgrounds and grid lines
            gridCtx.fillStyle = "black";
            gridCtx.font = "12px Arial";
            gridCtx.textAlign = "left";
            gridCtx.textBaseline = "middle";
            
            for (let r = 0; r < actualVisibleRows; r++) {
                for (let c = 0; c < actualVisibleCols; c++) {
                    const rowIndex = startRow + r;
                    const colIndex = startCol + c;
                    
                    // Skip if outside bounds
                    if (rowIndex >= totalRows || colIndex >= totalCols) continue;
                    
                    const cellValue = (data[rowIndex] && data[rowIndex][colIndex]) || "";
                    if (cellValue) {
                        const x = c * cellWidth + offsetX + 4;
                        const y = r * cellHeight + offsetY + cellHeight / 2;
                        gridCtx.fillText(cellValue, x, y);
                    }
                }
            }

            // Draw selection border (the green outline)
            if (selectionStart && selectionEnd) {
                const minRow = Math.min(selectionStart.row, selectionEnd.row);
                const maxRow = Math.max(selectionStart.row, selectionEnd.row);
                const minCol = Math.min(selectionStart.col, selectionEnd.col);
                const maxCol = Math.max(selectionStart.col, selectionEnd.col);

                
                    const x = (minCol - startCol) * cellWidth + offsetX + 0.5;
                    const y = (minRow - startRow) * cellHeight + offsetY + 0.5;
                    const width = (Math.min(maxCol, totalCols - 1) - minCol + 1) * cellWidth - 1;
                    const height = (Math.min(maxRow, totalRows - 1) - minRow + 1) * cellHeight - 1;

                    gridCtx.strokeStyle = "green";
                    gridCtx.lineWidth = 2;
                    gridCtx.strokeRect(x, y, width, height);
                
            }
        }

        // Draw column headers
        function drawColumnHeaders() {
            const scrollLeft = gridContainer.scrollLeft;
            
            columnCtx.clearRect(0, 0, columnCanvas.width, columnCanvas.height);
            columnCtx.fillStyle = "#f0f0f0";
            columnCtx.fillRect(0, 0, columnCanvas.width, headerHeight);

            const visibleCols = Math.ceil(columnCanvas.width / cellWidth) + 2;
            const startCol = Math.floor(scrollLeft / cellWidth);
            const offsetX = -(scrollLeft % cellWidth);

            // Calculate actual visible columns within limits
            const endCol = Math.min(startCol + visibleCols, totalCols);
            const actualVisibleCols = endCol - startCol;

            // Draw column separators (only for valid columns)
            columnCtx.strokeStyle = "#999";
            columnCtx.lineWidth = 0.5;
            for (let c = 0; c <= actualVisibleCols; c++) {
                const colIndex = startCol + c;
                if (colIndex > totalCols) break;
                
                const x = c * cellWidth + offsetX + 0.5;
                columnCtx.beginPath();
                columnCtx.moveTo(x, 0);
                columnCtx.lineTo(x, headerHeight);
                columnCtx.stroke();
            }

            // Draw column labels (only for valid columns)
            columnCtx.fillStyle = "black";
            columnCtx.font = "12px Arial";
            columnCtx.textAlign = "center";
            for (let c = 0; c < actualVisibleCols; c++) {
                const colIndex = startCol + c;
                if (colIndex >= totalCols) break;
                
                const x = c * cellWidth + offsetX + cellWidth / 2;
                if (x >= 0 && x < columnCanvas.width) {
                    columnCtx.fillText(getColumnLetter(colIndex), x, 20);
                }
            }
        }

        // Draw row headers
        function drawRowHeaders() {
            const scrollTop = gridContainer.scrollTop;
            
            rowCtx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);
            rowCtx.fillStyle = "#f0f0f0";
            rowCtx.fillRect(0, 0, headerWidth, rowCanvas.height);

            const visibleRows = Math.ceil(rowCanvas.height / cellHeight) + 2;
            const startRow = Math.floor(scrollTop / cellHeight);
            const offsetY = -(scrollTop % cellHeight);

            // Calculate actual visible rows within limits
            const endRow = Math.min(startRow + visibleRows, totalRows);
            const actualVisibleRows = endRow - startRow;

            // Draw row separators (only for valid rows)
            rowCtx.strokeStyle = "#999";
            rowCtx.lineWidth = 0.5;
            for (let r = 0; r <= actualVisibleRows; r++) {
                const rowIndex = startRow + r;
                if (rowIndex > totalRows) break;
                
                const y = r * cellHeight + offsetY + 0.5;
                rowCtx.beginPath();
                rowCtx.moveTo(0, y);
                rowCtx.lineTo(headerWidth, y);
                rowCtx.stroke();
            }

            // Draw row labels (only for valid rows)
            rowCtx.fillStyle = "black";
            rowCtx.font = "12px Arial";
            rowCtx.textAlign = "center";
            for (let r = 0; r < actualVisibleRows; r++) {
                const rowIndex = startRow + r;
                if (rowIndex >= totalRows) break;
                
                const y = r * cellHeight + offsetY + cellHeight / 2 + 4;
                if (y >= 0 && y < rowCanvas.height) {
                    rowCtx.fillText(rowIndex + 1, headerWidth / 2, y);
                }
            }
        }

        function drawAll() {
            drawGrid();
            drawColumnHeaders();
            drawRowHeaders();
        }

        // Handle scrolling
        gridContainer.addEventListener('scroll', () => {
            const scrollLeft = gridContainer.scrollLeft;
            const scrollTop = gridContainer.scrollTop;

            // Limit scrolling to actual grid boundaries
            const maxScrollLeft = Math.max(0, (totalCols * cellWidth) - (gridContainer.clientWidth - headerWidth));
            const maxScrollTop = Math.max(0, (totalRows * cellHeight) - (gridContainer.clientHeight - headerHeight));
            
            if (scrollLeft > maxScrollLeft) {
                gridContainer.scrollLeft = maxScrollLeft;
                return;
            }
            if (scrollTop > maxScrollTop) {
                gridContainer.scrollTop = maxScrollTop;
                return;
            }

            // Move canvas with scroll to stay on top of visible content
            gridCanvas.style.transform = `translate(${scrollLeft}px, ${scrollTop}px)`;

            drawAll();
            
            // Update input position if editing
            if (editingCell) {
                updateInputPosition();
            }
        });

        // const cellInput = document.getElementById("text-field");

        function updateInputPosition() {
            if (!editingCell) return;
            
            const scrollLeft = gridContainer.scrollLeft;
            const scrollTop = gridContainer.scrollTop;
            const { row, col } = editingCell;
            
            const inputX = (col * cellWidth) - scrollLeft + 50;
            const inputY = (row * cellHeight) - scrollTop + 30;
            
            cellInput.style.left = `${inputX}px`;
            cellInput.style.top = `${inputY}px`;
        }

        function startCellEdit(row, col) {
            editingCell = { row, col };
            
            const scrollLeft = gridContainer.scrollLeft;
            const scrollTop = gridContainer.scrollTop;
            
            const inputX = (col * cellWidth) - scrollLeft + 50;
            const inputY = (row * cellHeight) - scrollTop + 30;

            const cellValue = (data[row] && data[row][col]) || "";

            cellInput.style.left = `${inputX}px`;
            cellInput.style.top = `${inputY}px`;
            cellInput.style.width = `${cellWidth - 2}px`;
            cellInput.style.height = `${cellHeight - 2}px`;
            cellInput.value = cellValue;
            cellInput.style.display = "block";
            cellInput.select();
        }

        function saveEditingCell() {
            if (editingCell) {
                const value = cellInput.value;
                const { row, col } = editingCell;

                if (!data[row]) data[row] = {};
                data[row][col] = value;

                editingCell = null;
                cellInput.style.display = "none";
                drawGrid(); // Refresh grid to reflect new data
                
                console.log(`Saved: ${getColumnLetter(col)}${row + 1} = "${value}"`);
                console.log("Current data:", data);
            }
        }

        let mouseDownTime = 0;
        let mouseDownPos = null;
        let hasDragged = false;

        // Handle mouse down - start selection or prepare for editing
        gridCanvas.addEventListener("mousedown", (e) => {
            // If we're currently editing, save first
            if (editingCell) {
                saveEditingCell();
                return;
            }
            
            mouseDownTime = Date.now();
            mouseDownPos = { x: e.clientX, y: e.clientY };
            hasDragged = false;
            
            const rect = gridCanvas.getBoundingClientRect();
            const scrollLeft = gridContainer.scrollLeft;
            const scrollTop = gridContainer.scrollTop;

            const x = e.clientX - rect.left + scrollLeft;
            const y = e.clientY - rect.top + scrollTop;

            const col = Math.floor(x / cellWidth);
            const row = Math.floor(y / cellHeight);

            // Only allow selection within valid grid bounds
            if (col >= 0 && col < totalCols && row >= 0 && row < totalRows) {
                selectionStart = { row, col };
                selectionEnd = { row, col };
                selectedCell = { row, col };
                isSelecting = true;
                drawGrid();
            }
        });

        gridCanvas.addEventListener("mousemove", (e) => {
            if (!isSelecting || editingCell) return;

            // Check if mouse has moved enough to be considered a drag
            if (mouseDownPos && !hasDragged) {
                const distance = Math.sqrt(
                    Math.pow(e.clientX - mouseDownPos.x, 2) + 
                    Math.pow(e.clientY - mouseDownPos.y, 2)
                );
                if (distance > 3) { // 3px threshold
                    hasDragged = true;
                }
            }

            const rect = gridCanvas.getBoundingClientRect();
            const scrollLeft = gridContainer.scrollLeft;
            const scrollTop = gridContainer.scrollTop;

            const x = e.clientX - rect.left + scrollLeft;
            const y = e.clientY - rect.top + scrollTop;

            const col = Math.floor(x / cellWidth);
            const row = Math.floor(y / cellHeight);

            // Only allow selection within valid grid bounds
            if (col >= 0 && col < totalCols && row >= 0 && row < totalRows &&
                (selectionEnd.row !== row || selectionEnd.col !== col)) {
                selectionEnd = { row, col };
                drawGrid();
            }
        });

        document.addEventListener("mouseup", (e) => {
            if (isSelecting) {
                isSelecting = false;
                
                // Only start editing if it was a click (not a drag) and within a reasonable time
                const clickTime = Date.now() - mouseDownTime;
                if (!hasDragged && clickTime < 300 && selectionStart && 
                    selectionStart.row === selectionEnd.row && 
                    selectionStart.col === selectionEnd.col) {
                    
                    // Start editing the cell
                    startCellEdit(selectionStart.row, selectionStart.col);
                    console.log(`Selected cell: ${getColumnLetter(selectionStart.col)}${selectionStart.row + 1}`);
                } else if (hasDragged) {
                    console.log("Selected range:", selectionStart, selectionEnd);
                }
                
                // Reset tracking variables
                mouseDownTime = 0;
                mouseDownPos = null;
                hasDragged = false;
            }
        });

        // Input field event handlers
        cellInput.addEventListener("blur", saveEditingCell);

        cellInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                saveEditingCell();
            } else if (e.key === "Escape") {
                e.preventDefault();
                editingCell = null;
                cellInput.style.display = "none";
                drawGrid();
            }
        });

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (editingCell) return; // Don't navigate while editing
            
            if (!selectedCell) return;
            
            let newRow = selectedCell.row;
            let newCol = selectedCell.col;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newRow = Math.max(0, selectedCell.row - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newRow = Math.min(totalRows - 1, selectedCell.row + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newCol = Math.max(0, selectedCell.col - 1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newCol = Math.min(totalCols - 1, selectedCell.col + 1);
                    break;
                case 'Enter':
                case 'F2':
                    e.preventDefault();
                    startCellEdit(selectedCell.row, selectedCell.col);
                    return;
                default:
                    return;
            }
            
            // Update selection
            selectedCell = { row: newRow, col: newCol };
            selectionStart = { row: newRow, col: newCol };
            selectionEnd = { row: newRow, col: newCol };
            
            // Scroll to make the selected cell visible
            const cellX = newCol * cellWidth;
            const cellY = newRow * cellHeight;
            const containerRect = gridContainer.getBoundingClientRect();
            const scrollLeft = gridContainer.scrollLeft;
            const scrollTop = gridContainer.scrollTop;
            const visibleWidth = containerRect.width;
            const visibleHeight = containerRect.height;
            
            // Check if we need to scroll horizontally
            if (cellX < scrollLeft) {
                gridContainer.scrollLeft = cellX;
            } else if (cellX + cellWidth > scrollLeft + visibleWidth) {
                gridContainer.scrollLeft = cellX + cellWidth - visibleWidth;
            }
            
            // Check if we need to scroll vertically
            if (cellY < scrollTop) {
                gridContainer.scrollTop = cellY;
            } else if (cellY + cellHeight > scrollTop + visibleHeight) {
                gridContainer.scrollTop = cellY + cellHeight - visibleHeight;
            }
            
            drawGrid();
        });

        // Initial draw
        drawAll();
