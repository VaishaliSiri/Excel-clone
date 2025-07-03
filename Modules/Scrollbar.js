export class Scrollbar {
  constructor(canvasManager) {
    this.cm = canvasManager;
    this.isDraggingV = false;
    this.isDraggingH = false;
    this.initScrollbars();
  }

  initScrollbars() {
    // Create vertical scrollbar
    this.verticalScrollbar = document.createElement('div');
    this.verticalScrollbar.className = 'vertical-scrollbar';
    this.verticalScrollbar.style.cssText = `
      position: absolute;
      right: 0;
      top: ${this.cm.HEADER_HEIGHT}px;
      width: 17px;
      height: calc(100% - ${this.cm.HEADER_HEIGHT + 17}px);
      background: #f8f8f8;
      border-left: 1px solid #d4d4d4;
      z-index: 20;
      overflow: hidden;
    `;

    this.verticalThumb = document.createElement('div');
    this.verticalThumb.className = 'vertical-thumb';
    this.verticalThumb.style.cssText = `
      position: absolute;
      top: 0;
      left: 1px;
      width: 15px;
      background: #c1c1c1;
      border-radius: 8px;
      cursor: pointer;
      min-height: 20px;
      transition: background-color 0.2s ease;
    `;

    // Create horizontal scrollbar
    this.horizontalScrollbar = document.createElement('div');
    this.horizontalScrollbar.className = 'horizontal-scrollbar';
    this.horizontalScrollbar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: ${this.cm.HEADER_WIDTH}px;
      height: 17px;
      width: calc(100% - ${this.cm.HEADER_WIDTH + 17}px);
      background: #f8f8f8;
      border-top: 1px solid #d4d4d4;
      z-index: 20;
      overflow: hidden;
    `;

    this.horizontalThumb = document.createElement('div');
    this.horizontalThumb.className = 'horizontal-thumb';
    this.horizontalThumb.style.cssText = `
      position: absolute;
      left: 0;
      top: 1px;
      height: 15px;
      background: #c1c1c1;
      border-radius: 8px;
      cursor: pointer;
      min-width: 20px;
      transition: background-color 0.2s ease;
    `;

    // Create corner element
    this.corner = document.createElement('div');
    this.corner.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 17px;
      height: 17px;
      background: #f8f8f8;
      border-top: 1px solid #d4d4d4;
      border-left: 1px solid #d4d4d4;
      z-index: 21;
    `;

    this.verticalScrollbar.appendChild(this.verticalThumb);
    this.horizontalScrollbar.appendChild(this.horizontalThumb);
    
    this.cm.container.appendChild(this.verticalScrollbar);
    this.cm.container.appendChild(this.horizontalScrollbar);
    this.cm.container.appendChild(this.corner);
    
    this.attachEvents();
  }

  attachEvents() {
    // Vertical scrollbar events
    this.verticalThumb.addEventListener('mouseenter', () => {
      if (!this.isDraggingV) {
        this.verticalThumb.style.background = '#a8a8a8';
      }
    });
    
    this.verticalThumb.addEventListener('mouseleave', () => {
      if (!this.isDraggingV) {
        this.verticalThumb.style.background = '#c1c1c1';
      }
    });

    this.verticalThumb.addEventListener('mousedown', (e) => {
      this.isDraggingV = true;
      this.startY = e.clientY;
      this.startScrollY = this.cm.scrollY;
      this.verticalThumb.style.background = '#787878';
      e.preventDefault();
      document.body.style.userSelect = 'none';
    });

    // Horizontal scrollbar events
    this.horizontalThumb.addEventListener('mouseenter', () => {
      if (!this.isDraggingH) {
        this.horizontalThumb.style.background = '#a8a8a8';
      }
    });
    
    this.horizontalThumb.addEventListener('mouseleave', () => {
      if (!this.isDraggingH) {
        this.horizontalThumb.style.background = '#c1c1c1';
      }
    });

    this.horizontalThumb.addEventListener('mousedown', (e) => {
      this.isDraggingH = true;
      this.startX = e.clientX;
      this.startScrollX = this.cm.scrollX;
      this.horizontalThumb.style.background = '#787878';
      e.preventDefault();
      document.body.style.userSelect = 'none';
    });

    // Global mouse events
    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingV) {
        const deltaY = e.clientY - this.startY;
        const scrollbarHeight = this.verticalScrollbar.clientHeight;
        const thumbHeight = this.verticalThumb.clientHeight;
        const maxThumbTop = scrollbarHeight - thumbHeight;
        const maxScrollY = this.cm.getMaxScrollY();
        
        if (maxThumbTop > 0) {
          const scrollRatio = deltaY / maxThumbTop;
          const newScrollY = Math.max(0, Math.min(maxScrollY, this.startScrollY + scrollRatio * maxScrollY));
          this.cm.scrollY = newScrollY;
          this.cm.render();
          this.updateScrollbars();
        }
      }

      if (this.isDraggingH) {
        const deltaX = e.clientX - this.startX;
        const scrollbarWidth = this.horizontalScrollbar.clientWidth;
        const thumbWidth = this.horizontalThumb.clientWidth;
        const maxThumbLeft = scrollbarWidth - thumbWidth;
        const maxScrollX = this.cm.getMaxScrollX();
        
        if (maxThumbLeft > 0) {
          const scrollRatio = deltaX / maxThumbLeft;
          const newScrollX = Math.max(0, Math.min(maxScrollX, this.startScrollX + scrollRatio * maxScrollX));
          this.cm.scrollX = newScrollX;
          this.cm.render();
          this.updateScrollbars();
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDraggingV) {
        this.isDraggingV = false;
        this.verticalThumb.style.background = '#c1c1c1';
        document.body.style.userSelect = '';
      }
      if (this.isDraggingH) {
        this.isDraggingH = false;
        this.horizontalThumb.style.background = '#c1c1c1';
        document.body.style.userSelect = '';
      }
    });

    // Scrollbar track clicking
    this.verticalScrollbar.addEventListener('click', (e) => {
      if (e.target === this.verticalScrollbar) {
        const rect = this.verticalScrollbar.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const thumbHeight = this.verticalThumb.clientHeight;
        const scrollbarHeight = this.verticalScrollbar.clientHeight;
        const maxScrollY = this.cm.getMaxScrollY();
        
        const targetThumbTop = clickY - thumbHeight / 2;
        const scrollRatio = targetThumbTop / (scrollbarHeight - thumbHeight);
        const newScrollY = Math.max(0, Math.min(maxScrollY, scrollRatio * maxScrollY));
        
        this.cm.scrollY = newScrollY;
        this.cm.render();
        this.updateScrollbars();
      }
    });

    this.horizontalScrollbar.addEventListener('click', (e) => {
      if (e.target === this.horizontalScrollbar) {
        const rect = this.horizontalScrollbar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const thumbWidth = this.horizontalThumb.clientWidth;
        const scrollbarWidth = this.horizontalScrollbar.clientWidth;
        const maxScrollX = this.cm.getMaxScrollX();
        
        const targetThumbLeft = clickX - thumbWidth / 2;
        const scrollRatio = targetThumbLeft / (scrollbarWidth - thumbWidth);
        const newScrollX = Math.max(0, Math.min(maxScrollX, scrollRatio * maxScrollX));
        
        this.cm.scrollX = newScrollX;
        this.cm.render();
        this.updateScrollbars();
      }
    });

    // Mouse wheel support for scrollbars
    this.verticalScrollbar.addEventListener('wheel', (e) => {
      e.preventDefault();
      const scrollSpeed = 3;
      const deltaY = e.deltaY * scrollSpeed;
      const maxScrollY = this.cm.getMaxScrollY();
      
      this.cm.scrollY = Math.max(0, Math.min(maxScrollY, this.cm.scrollY + deltaY));
      this.cm.render();
      this.updateScrollbars();
    });

    this.horizontalScrollbar.addEventListener('wheel', (e) => {
      e.preventDefault();
      const scrollSpeed = 3;
      const deltaX = e.deltaX * scrollSpeed;
      const maxScrollX = this.cm.getMaxScrollX();
      
      this.cm.scrollX = Math.max(0, Math.min(maxScrollX, this.cm.scrollX + deltaX));
      this.cm.render();
      this.updateScrollbars();
    });
  }

  updateScrollbars() {
    // Update vertical scrollbar
    const maxScrollY = this.cm.getMaxScrollY();
    const viewportHeight = this.cm.viewportHeight - this.cm.HEADER_HEIGHT - 17;
    const contentHeight = this.cm.totalRows * this.cm.CELL_HEIGHT;
    
    if (maxScrollY > 0) {
      const thumbHeightRatio = viewportHeight / contentHeight;
      const thumbHeight = Math.max(20, this.verticalScrollbar.clientHeight * thumbHeightRatio);
      const scrollRatio = this.cm.scrollY / maxScrollY;
      const thumbTop = (this.verticalScrollbar.clientHeight - thumbHeight) * scrollRatio;
      
      this.verticalThumb.style.height = `${thumbHeight}px`;
      this.verticalThumb.style.top = `${thumbTop}px`;
      this.verticalScrollbar.style.display = 'block';
    } else {
      this.verticalScrollbar.style.display = 'none';
    }

    // Update horizontal scrollbar
    const maxScrollX = this.cm.getMaxScrollX();
    const viewportWidth = this.cm.viewportWidth - this.cm.HEADER_WIDTH - 17;
    const contentWidth = this.cm.totalCols * this.cm.CELL_WIDTH;
    
    if (maxScrollX > 0) {
      const thumbWidthRatio = viewportWidth / contentWidth;
      const thumbWidth = Math.max(20, this.horizontalScrollbar.clientWidth * thumbWidthRatio);
      const scrollRatio = this.cm.scrollX / maxScrollX;
      const thumbLeft = (this.horizontalScrollbar.clientWidth - thumbWidth) * scrollRatio;
      
      this.horizontalThumb.style.width = `${thumbWidth}px`;
      this.horizontalThumb.style.left = `${thumbLeft}px`;
      this.horizontalScrollbar.style.display = 'block';
    } else {
      this.horizontalScrollbar.style.display = 'none';
    }

    // Update corner visibility
    const showCorner = maxScrollX > 0 && maxScrollY > 0;
    this.corner.style.display = showCorner ? 'block' : 'none';
  }
}