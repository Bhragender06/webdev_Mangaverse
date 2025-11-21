// MangaVerse Application JavaScript
class MangaVerseApp {
    constructor() {
        this.currentUser = null;
        this.readingProgress = {};
        this.currentChapter = 1;
        this.currentPage = 1;
        this.totalPages = 200;
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
    }

    // User Authentication
    loadUserData() {
        const userData = localStorage.getItem('mangaVerseUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.loadReadingProgress();
        }
    }

    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('mangaVerseUser', JSON.stringify(this.currentUser));
        }
    }

    loadReadingProgress() {
        const progress = localStorage.getItem('mangaVerseProgress');
        if (progress) {
            this.readingProgress = JSON.parse(progress);
        }
    }

    saveReadingProgress() {
        localStorage.setItem('mangaVerseProgress', JSON.stringify(this.readingProgress));
    }

    // Navigation Functions
    openDemonSlayer() {
        // Check if user is logged in
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        // Get last reading position
        const lastPosition = this.readingProgress['demon-slayer'] || { chapter: 1, page: 1 };
        this.currentChapter = lastPosition.chapter;
        this.currentPage = lastPosition.page;

        // Navigate to reader
        window.location.href = `reader.html?chapter=${this.currentChapter}&page=${this.currentPage}`;
    }

    openChapters() {
        window.location.href = 'chapters.html';
    }

    openManga(mangaId) {
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        // For now, only Demon Slayer is available
        if (mangaId === 'demon-slayer' || mangaId === 'attack-on-titan' || mangaId === 'one-piece' || mangaId === 'naruto') {
            this.showComingSoon();
        }
    }

    showLoginPrompt() {
        if (confirm('Please login to continue reading. Would you like to login now?')) {
            window.location.href = 'login.html';
        }
    }

    showComingSoon() {
        alert('This manga is coming soon! Currently only Demon Slayer is available.');
    }

    // UI Updates
    updateUI() {
        this.updateUserInfo();
        this.updateNavigation();
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const loginBtn = document.querySelector('.login-btn');
        const registerBtn = document.querySelector('.register-btn');

        if (this.currentUser && userInfo) {
            userInfo.style.display = 'flex';
            userName.textContent = this.currentUser.username;
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
        } else {
            if (userInfo) userInfo.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
        }
    }

    updateNavigation() {
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPage || 
                (currentPage === '' && link.getAttribute('href') === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    // Reading Progress Management
    updateReadingProgress(chapter, page) {
        if (!this.currentUser) return;

        this.readingProgress['demon-slayer'] = {
            chapter: chapter,
            page: page,
            timestamp: Date.now()
        };

        this.saveReadingProgress();
        this.updateProgressUI();
    }

    updateProgressUI() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            const progress = this.readingProgress['demon-slayer'];
            if (progress) {
                const percentage = ((progress.chapter - 1) * this.totalPages + progress.page) / (23 * this.totalPages) * 100;
                progressFill.style.width = `${Math.min(percentage, 100)}%`;
                progressText.textContent = `${Math.round(percentage)}% Complete`;
            }
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Auto-save reading progress
        setInterval(() => {
            if (this.currentUser && this.readingProgress['demon-slayer']) {
                this.saveReadingProgress();
            }
        }, 30000); // Save every 30 seconds
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts in reader page
        if (!window.location.pathname.includes('reader.html')) return;

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

    // Reader Functions
    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateReadingProgress(this.currentChapter, this.currentPage);
            this.loadPDFPage();
        }
    }

    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updateReadingProgress(this.currentChapter, this.currentPage);
            this.loadPDFPage();
        }
    }

    async previousChapter() {
        if (this.currentChapter > 1) {
            this.currentChapter--;
            this.currentPage = 1;
            this.updateReadingProgress(this.currentChapter, this.currentPage);
            this.loadPDFPage();
        }
    }

    async nextChapter() {
        if (this.currentChapter < 23) {
            this.currentChapter++;
            this.currentPage = 1;
            this.updateReadingProgress(this.currentChapter, this.currentPage);
            this.loadPDFPage();
        }
    }

    async changeChapter(chapterNumber) {
        this.currentChapter = parseInt(chapterNumber);
        this.currentPage = 1;
        this.updateReadingProgress(this.currentChapter, this.currentPage);
        this.loadPDFPage();
    }

    loadPDFPage() {
        // This would integrate with PDF.js
        console.log(`Loading Chapter ${this.currentChapter}, Page ${this.currentPage}`);
        this.updatePageInfo();
    }

    updatePageInfo() {
        const pageInfo = document.getElementById('pageInfo');
        const currentChapter = document.getElementById('currentChapter');
        const progressInfo = document.getElementById('progressInfo');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
        
        if (currentChapter) {
            currentChapter.textContent = `Volume ${this.currentChapter}`;
        }
        
        if (progressInfo) {
            progressInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    goBack() {
        window.history.back();
    }

    // Utility Functions
    logout() {
        this.currentUser = null;
        localStorage.removeItem('mangaVerseUser');
        this.updateUI();
        window.location.href = 'index.html';
    }

    // Public API for other scripts
    getCurrentUser() {
        return this.currentUser;
    }

    getReadingProgress() {
        return this.readingProgress;
    }

    setReadingProgress(mangaId, chapter, page) {
        this.readingProgress[mangaId] = {
            chapter: chapter,
            page: page,
            timestamp: Date.now()
        };
        this.saveReadingProgress();
    }
}

// Initialize the application
const app = new MangaVerseApp();

// Global functions for HTML onclick handlers
function openDemonSlayer() {
    app.openDemonSlayer();
}

function openChapters() {
    app.openChapters();
}

function openManga(mangaId) {
    app.openManga(mangaId);
}

function startReadingFromBeginning() {
    app.setReadingProgress('demon-slayer', 1, 1);
    window.location.href = 'reader.html?chapter=1&page=1';
}

function continueReading() {
    const progress = app.getReadingProgress()['demon-slayer'];
    if (progress) {
        window.location.href = `reader.html?chapter=${progress.chapter}&page=${progress.page}`;
    } else {
        startReadingFromBeginning();
    }
}

// Reader-specific functions
async function previousPage() {
    await app.previousPage();
}

async function nextPage() {
    await app.nextPage();
}

async function previousChapter() {
    await app.previousChapter();
}

async function nextChapter() {
    await app.nextChapter();
}

async function changeChapter(chapterNumber) {
    await app.changeChapter(chapterNumber);
}

function toggleFullscreen() {
    app.toggleFullscreen();
}

function goBack() {
    app.goBack();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update UI after DOM is loaded
    app.updateUI();
    
    // Load URL parameters for reader
    const urlParams = new URLSearchParams(window.location.search);
    const chapter = urlParams.get('chapter');
    const page = urlParams.get('page');
    
    if (chapter && page) {
        app.currentChapter = parseInt(chapter);
        app.currentPage = parseInt(page);
        app.updatePageInfo();
    }
});
