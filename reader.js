// PDF Reader JavaScript
class PDFReader {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.currentChapter = 1;
        this.mangaId = 'demon-slayer';
        this.totalPages = 0;
        this.scale = 1.0;
        this.fitMode = localStorage.getItem('mv_fit_mode') || 'width'; // 'width' | 'height'
        this.phoneMode = (localStorage.getItem('mv_phone_mode') || 'on') === 'on';
        this.phoneAspect = parseFloat(localStorage.getItem('mv_phone_aspect')) || (19.5 / 9); // ~6.7" phone aspect
        this.canvas = null;
        this.ctx = null;
        this.doublePage = false;
        this.init();
    }

    getTotalUnits() {
        const cfg = window.MANGA_CONFIG ? window.MANGA_CONFIG[this.mangaId] : null;
        return (cfg && cfg.volumesCount) ? cfg.volumesCount : 23;
    }

    init() {
        this.canvas = document.getElementById('pdfCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.mangaId = urlParams.get('manga') || 'demon-slayer';
        this.currentChapter = parseInt(urlParams.get('chapter')) || 1;
        this.currentPage = parseInt(urlParams.get('page')) || 1;
        
        console.log('PDF Reader initialized:', {
            currentChapter: this.currentChapter,
            currentPage: this.currentPage,
            canvas: this.canvas,
            ctx: this.ctx
        });
        
        this.setupEventListeners();
        this.populateChapterSelect();
        this.loadPDF();
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevPageBtn')?.addEventListener('click', () => this.previousPage());
        document.getElementById('nextPageBtn')?.addEventListener('click', () => this.nextPage());
        document.getElementById('prevChapterBtn')?.addEventListener('click', () => this.previousChapter());
        document.getElementById('nextChapterBtn')?.addEventListener('click', () => this.nextChapter());
        
        // Chapter selector
        document.getElementById('chapterSelect')?.addEventListener('change', (e) => this.changeChapter(parseInt(e.target.value)));
        
        // Zoom controls
        document.getElementById('zoomSlider')?.addEventListener('input', (e) => this.changeZoom(parseInt(e.target.value)));
        
        // Reading mode
        document.getElementById('readingMode')?.addEventListener('change', (e) => this.changeReadingMode(e.target.value));
        
        // Auto-scroll
        document.getElementById('autoScroll')?.addEventListener('change', (e) => this.toggleAutoScroll(e.target.checked));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    async loadPDF() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'flex';
        }

        try {
            // Build PDF path via config
            const pdfPath = (window.buildPdfPath && window.MANGA_CONFIG)
                ? window.buildPdfPath(this.mangaId, this.currentChapter)
                : `Demon Slayer/Demon Slayer [Volume ${this.currentChapter.toString().padStart(2, '0')}].pdf`;
            
            console.log('Attempting to load PDF:', pdfPath);
            
            // Load PDF using PDF.js
            const loadingTask = pdfjsLib.getDocument({
                url: pdfPath,
                cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                cMapPacked: true,
            });
            
            this.pdfDoc = await loadingTask.promise;
            this.totalPages = this.pdfDoc.numPages;
            
            console.log('PDF loaded successfully. Total pages:', this.totalPages);
            
            await this.renderPage();
            this.updateUI();
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            const fallback = (window.MANGA_CONFIG && window.MANGA_CONFIG[this.mangaId]) ? window.buildPdfPath(this.mangaId, this.currentChapter) : 'Unknown.pdf';
            this.showError(`Failed to load PDF: ${error.message}. Expected at: ${fallback}`);
        } finally {
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        }
    }


    async renderPage() {
        if (!this.pdfDoc) return;

        try {
            const page = await this.pdfDoc.getPage(this.currentPage);
            const container = document.querySelector('.pdf-viewer');

            // Determine available render area. For height, subtract chrome (header/toolbar/progress)
            const availableWidth = Math.max(0, (container?.clientWidth || Math.floor(window.innerWidth * 0.95)));
            const headerEl = document.querySelector('.header');
            const toolbarEl = document.querySelector('.reading-toolbar');
            const progressEl = document.querySelector('.reading-progress');
            const chromeHeight =
                (headerEl ? headerEl.getBoundingClientRect().height : 0) +
                (toolbarEl ? toolbarEl.getBoundingClientRect().height : 0) +
                (progressEl ? progressEl.getBoundingClientRect().height : 0) + 24; // small spacing buffer
            const viewportH = window.innerHeight || document.documentElement.clientHeight || 800;
            const availableHeight = Math.max(0, (container?.clientHeight || (viewportH - chromeHeight)));

            // Base viewport to extract intrinsic PDF page ratio
            const baseViewport = page.getViewport({ scale: 1.0 });
            const pageAR = baseViewport.height / baseViewport.width; // aspect ratio (H/W)

            // If phoneMode is enabled, first compute a fixed phone-frame box by aspect ratio
            let frameWidth = availableWidth;
            let frameHeight = availableHeight;
            if (this.phoneMode) {
                // Constrain to phone aspect (H/W)
                const phoneAR = this.phoneAspect; // H/W
                // Compute width-first candidate keeping inside available area
                const widthByHeight = availableHeight / phoneAR;
                if (widthByHeight <= availableWidth) {
                    // Height is limiting
                    frameWidth = Math.floor(widthByHeight);
                    frameHeight = Math.floor(frameWidth * phoneAR);
                } else {
                    // Width is limiting
                    frameWidth = Math.floor(availableWidth);
                    frameHeight = Math.floor(frameWidth * phoneAR);
                }
            }

            // Compute fit scale by selected mode relative to chosen frame, then apply user zoom multiplier (stable)
            const targetWidth = this.phoneMode ? frameWidth : availableWidth;
            const targetHeight = this.phoneMode ? frameHeight : availableHeight;
            let fitScale;
            const fitPref = this.phoneMode ? 'height' : this.fitMode;
            if (fitPref === 'height') {
                fitScale = targetHeight / baseViewport.height;
            } else {
                // default: fit width
                fitScale = targetWidth / baseViewport.width;
            }
            const zoomMultiplier = Math.max(0.25, this.scale);
            const finalScale = Math.max(0.1, fitScale) * zoomMultiplier;
            const viewport = page.getViewport({ scale: finalScale });

            // Compute CSS display size from target frame, preserving PDF page AR inside the frame (letterbox if needed)
            let cssWidth, cssHeight;
            if (fitPref === 'height') {
                cssHeight = Math.min(targetHeight, viewport.height);
                cssWidth = Math.min(targetWidth, cssHeight / pageAR);
            } else {
                cssWidth = Math.min(targetWidth, viewport.width);
                cssHeight = Math.min(targetHeight, cssWidth * pageAR);
            }

            // Render at device pixel ratio for crispness, keep CSS size fixed
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.floor(cssWidth * dpr);
            this.canvas.height = Math.floor(cssHeight * dpr);
            this.canvas.style.width = Math.floor(cssWidth) + 'px';
            this.canvas.style.height = Math.floor(cssHeight) + 'px';

            // Clear canvas
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const renderContext = {
                canvasContext: this.ctx,
                viewport: page.getViewport({ scale: finalScale * (cssWidth / viewport.width) }),
                transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined
            };

            await page.render(renderContext).promise;

        } catch (error) {
            console.error('Error rendering page:', error);
            this.showError('Failed to render page. Please try again.');
        }
    }

    populateChapterSelect() {
        const select = document.getElementById('chapterSelect');
        if (!select) return;
        select.innerHTML = '';
        const cfg = window.MANGA_CONFIG ? window.MANGA_CONFIG[this.mangaId] : { volumesCount: 23, unitLabel: 'Volume' };
        const total = cfg.volumesCount || 23;
        const unit = cfg.unitLabel || 'Volume';
        for (let i = 1; i <= total; i++) {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `${unit} ${i}`;
            select.appendChild(opt);
        }
        select.value = String(this.currentChapter);
    }

    setFitMode(mode) {
        this.fitMode = mode === 'height' ? 'height' : 'width';
        try { localStorage.setItem('mv_fit_mode', this.fitMode); } catch (_) {}
        this.renderPage();
    }

    setPhoneMode(enabled) {
        this.phoneMode = !!enabled;
        try { localStorage.setItem('mv_phone_mode', this.phoneMode ? 'on' : 'off'); } catch (_) {}
        this.renderPage();
    }

    setPhoneAspect(hOverW) {
        const val = parseFloat(hOverW);
        if (!isNaN(val) && val > 0.2 && val < 5) {
            this.phoneAspect = val;
            try { localStorage.setItem('mv_phone_aspect', String(this.phoneAspect)); } catch (_) {}
            this.renderPage();
        }
    }

    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.renderPage();
            this.updateUI();
            this.saveProgress();
        }
    }

    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            await this.renderPage();
            this.updateUI();
            this.saveProgress();
        }
    }

    async previousChapter() {
        if (this.currentChapter > 1) {
            this.currentChapter--;
            this.currentPage = 1;
            await this.loadPDF();
        }
    }

    async nextChapter() {
        if (this.currentChapter < this.getTotalUnits()) {
            this.currentChapter++;
            this.currentPage = 1;
            await this.loadPDF();
        }
    }

    async changeChapter(chapterNumber) {
        this.currentChapter = chapterNumber;
        this.currentPage = 1;
        await this.loadPDF();
    }

    async changeZoom(zoomValue) {
        this.scale = zoomValue / 100;
        document.getElementById('zoomValue').textContent = `${zoomValue}%`;
        await this.renderPage();
    }

    changeReadingMode(mode) {
        // Implement different reading modes
        console.log('Reading mode changed to:', mode);
        
        const pdfViewer = document.getElementById('pdfViewer');
        const indicator = document.getElementById('readingModeIndicator');
        
        // Remove existing mode classes
        pdfViewer.classList.remove('single-page', 'double-page', 'webtoon');
        
        // Add new mode class
        pdfViewer.classList.add(mode);
        
        // Update indicator
        if (indicator) {
            indicator.textContent = `Reading Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)} Page`;
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 2000);
        }
        
        // Adjust layout based on mode
        this.adjustLayoutForMode(mode);
    }

    adjustLayoutForMode(mode) {
        const container = document.querySelector('.pdf-viewer-container');
        
        switch(mode) {
            case 'single':
                container.style.justifyContent = 'center';
                break;
            case 'double':
                container.style.justifyContent = 'flex-start';
                break;
            case 'webtoon':
                container.style.justifyContent = 'center';
                break;
        }
    }

    toggleAutoScroll(enabled) {
        if (enabled) {
            this.startAutoScroll();
        } else {
            this.stopAutoScroll();
        }
    }

    startAutoScroll() {
        // Implement auto-scroll functionality
        console.log('Auto-scroll enabled');
    }

    stopAutoScroll() {
        // Stop auto-scroll
        console.log('Auto-scroll disabled');
    }

    handleKeyboardShortcuts(e) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousPage();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextPage();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.previousChapter();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.nextChapter();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                this.toggleFullscreen();
                break;
        }
    }

    async handleResize() {
        await this.renderPage();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    updateUI() {
        // Update page info
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }

        // Update chapter info
        const currentChapter = document.getElementById('currentChapter');
        if (currentChapter) {
            currentChapter.textContent = `Volume ${this.currentChapter}`;
        }

        // Update progress info
        const progressInfo = document.getElementById('progressInfo');
        if (progressInfo) {
            progressInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }

        // Update chapter selector
        const chapterSelect = document.getElementById('chapterSelect');
        if (chapterSelect) {
            chapterSelect.value = this.currentChapter;
        }

        // Update navigation buttons
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const prevChapterBtn = document.getElementById('prevChapterBtn');
        const nextChapterBtn = document.getElementById('nextChapterBtn');

        if (prevPageBtn) prevPageBtn.disabled = this.currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = this.currentPage >= this.totalPages;
        if (prevChapterBtn) prevChapterBtn.disabled = this.currentChapter <= 1;
        if (nextChapterBtn) nextChapterBtn.disabled = this.currentChapter >= this.getTotalUnits();

        // Update progress bar
        this.updateProgressBar();
    }

    updateProgressBar() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            const totalPagesInSeries = this.getTotalUnits() * this.totalPages;
            const currentPageInSeries = (this.currentChapter - 1) * this.totalPages + this.currentPage;
            const percentage = (currentPageInSeries / totalPagesInSeries) * 100;
            
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
            progressText.textContent = `${Math.round(percentage)}% Complete`;
        }
    }

    saveProgress() {
        // Save reading progress to localStorage
        const userData = localStorage.getItem('mangaVerseUser');
        if (userData) {
        const progress = JSON.parse(localStorage.getItem('mangaVerseProgress') || '{}');
        progress[this.mangaId] = {
                chapter: this.currentChapter,
                page: this.currentPage,
                timestamp: Date.now()
            };
            localStorage.setItem('mangaVerseProgress', JSON.stringify(progress));
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
            z-index: 1000;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Enhanced Reading Functions
    toggleFocusMode() {
        const body = document.body;
        const pdfViewer = document.getElementById('pdfViewer');
        
        body.classList.toggle('reading-focus-mode');
        
        if (body.classList.contains('reading-focus-mode')) {
            // Hide other elements
            document.querySelector('.reading-toolbar').style.display = 'none';
            document.querySelector('.reading-progress').style.display = 'none';
            document.querySelector('.reading-controls').style.display = 'none';
        } else {
            // Show other elements
            document.querySelector('.reading-toolbar').style.display = 'flex';
            document.querySelector('.reading-progress').style.display = 'block';
            document.querySelector('.reading-controls').style.display = 'flex';
        }
    }

    toggleReadingMode() {
        const currentMode = document.getElementById('readingMode').value;
        const modes = ['single', 'double', 'webtoon'];
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];
        
        document.getElementById('readingMode').value = nextMode;
        this.changeReadingMode(nextMode);
    }

    toggleAutoScroll() {
        const autoScrollCheckbox = document.getElementById('autoScroll');
        autoScrollCheckbox.checked = !autoScrollCheckbox.checked;
        this.toggleAutoScroll(autoScrollCheckbox.checked);
    }

    // Add page turn animation
    async nextPageWithAnimation() {
        const pdfViewer = document.getElementById('pdfViewer');
        pdfViewer.classList.add('page-turn-animation');
        
        await this.nextPage();
        
        setTimeout(() => {
            pdfViewer.classList.remove('page-turn-animation');
        }, 600);
    }

    async previousPageWithAnimation() {
        const pdfViewer = document.getElementById('pdfViewer');
        pdfViewer.classList.add('page-turn-animation');
        
        await this.previousPage();
        
        setTimeout(() => {
            pdfViewer.classList.remove('page-turn-animation');
        }, 600);
    }
}

// Global functions for enhanced reading controls
function toggleFocusMode() {
    if (window.pdfReader) {
        window.pdfReader.toggleFocusMode();
    }
}

function toggleReadingMode() {
    if (window.pdfReader) {
        window.pdfReader.toggleReadingMode();
    }
}

function toggleAutoScroll() {
    if (window.pdfReader) {
        window.pdfReader.toggleAutoScroll();
    }
}

// Initialize PDF reader when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.pdfReader = new PDFReader();
});
