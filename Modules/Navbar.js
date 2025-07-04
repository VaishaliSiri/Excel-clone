export class Navbar {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.injectStyles();
    this.createNavbar();
    this.attachEvents();
  }

  injectStyles() {
    if (document.getElementById('navbar-styles')) return;

    const style = document.createElement('style');
    style.id = 'navbar-styles';
    style.textContent = `
      .spreadsheet-navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 50px;
        background: green;
        display: flex;
        align-items: center;
        padding: 0 20px;
        z-index: 1000;
      }

      .navbar-title {
        color: white;
        font-size: 18px;
        font-weight: 600;
        margin-right: 30px;
      }

      .navbar-buttons {
        display: flex;
        gap: 12px;
      }

      .navbar-btn {
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .file-input {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  createNavbar() {
    this.navbar = document.createElement('div');
    this.navbar.className = 'spreadsheet-navbar';

    const title = document.createElement('div');
    title.className = 'navbar-title';
    title.textContent = 'Excel Clone';

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'navbar-buttons';

    this.loadBtn = document.createElement('button');
    this.loadBtn.className = 'navbar-btn load-btn';
    this.loadBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
      Load Data
    `;

    this.clearBtn = document.createElement('button');
    this.clearBtn.className = 'navbar-btn clear-btn';
    this.clearBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3,6 5,6 21,6"/>
        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
      Clear Data
    `;

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json';
    this.fileInput.className = 'file-input';

    buttonsContainer.appendChild(this.loadBtn);
    buttonsContainer.appendChild(this.clearBtn);
    this.navbar.appendChild(title);
    this.navbar.appendChild(buttonsContainer);
    this.navbar.appendChild(this.fileInput);

    document.body.insertBefore(this.navbar, document.body.firstChild);
  }

  attachEvents() {
    this.loadBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadDataFromFile(file);
      }
    });

    this.clearBtn.addEventListener('click', () => {
      this.clearData();
    });
  }

  async loadDataFromFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of objects');
      }

      this.canvasManager.cellData = new Map();

      const allKeys = new Set();
      data.forEach(row => {
        if (typeof row === 'object' && row !== null) {
          Object.keys(row).forEach(key => allKeys.add(key));
        }
      });

      const columnKeys = Array.from(allKeys);
      columnKeys.forEach((key, colIndex) => {
        this.canvasManager.setCellData(0, colIndex, key);
      });

      data.forEach((row, rowIndex) => {
        if (typeof row === 'object' && row !== null) {
          columnKeys.forEach((key, colIndex) => {
            const value = row[key];
            if (value !== undefined && value !== null) {
              this.canvasManager.setCellData(rowIndex + 1, colIndex, String(value));
            }
          });
        }
      });

      this.canvasManager.render();
      this.fileInput.value = '';
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  clearData() {
    this.canvasManager.cellData = new Map();
    this.canvasManager.resizer.colSizes.clear();
    this.canvasManager.resizer.rowSizes.clear();

    this.canvasManager.selection.startRow = null;
    this.canvasManager.selection.startCol = null;
    this.canvasManager.selection.endRow = null;
    this.canvasManager.selection.endCol = null;
    this.canvasManager.selection.active = false;
    this.canvasManager.selection.selectionType = 'cell';
    this.canvasManager.selection.selectedRow = null;
    this.canvasManager.selection.selectedCol = null;

    this.canvasManager.scrollX = 0;
    this.canvasManager.scrollY = 0;
    this.canvasManager.scrollbar.updateScrollbars();

    this.canvasManager.render();
  }
}
