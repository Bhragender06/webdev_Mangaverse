// Chapters Page JavaScript
class ChaptersManager {
    constructor() {
        this.chapters = [];
        this.filteredChapters = [];
        this.currentFilter = 'all';
        const urlParams = new URLSearchParams(window.location.search);
        this.mangaId = urlParams.get('manga') || 'demon-slayer';
        this.config = window.MANGA_CONFIG ? window.MANGA_CONFIG[this.mangaId] : null;
        this.init();
    }

    init() {
        this.generateChapters();
        this.setupEventListeners();
        this.renderChapters();
    }

    generateChapters() {
        const cfg = this.config || { title: 'Demon Slayer: Kimetsu no Yaiba', volumesCount: 23, unitLabel: 'Volume' };
        const total = cfg.volumesCount || 23;

        // Update header UI bits
        const posterEl = document.getElementById('mangaPoster');
        const titleEl = document.getElementById('mangaTitle');
        const countEl = document.getElementById('mangaCount');
        const unitEl = document.getElementById('mangaUnit');
        if (posterEl && cfg.cover) posterEl.src = cfg.cover;
        if (titleEl && cfg.title) titleEl.textContent = cfg.title;
        if (countEl) countEl.textContent = total;
        if (unitEl) unitEl.textContent = (cfg.unitLabel || 'Volume') + (total > 1 ? 's' : '');

        this.chapters = [];
        for (let i = 1; i <= total; i++) {
            const isRead = this.isChapterRead(i);
            this.chapters.push({
                id: i,
                title: `${cfg.unitLabel || 'Volume'} ${i}`,
                description: `${cfg.title} ${cfg.unitLabel || 'Volume'} ${i}`,
                status: isRead ? 'read' : 'unread',
                pages: 200,
                releaseDate: this.getReleaseDate(i),
                rating: 9.5
            });
        }

        this.filteredChapters = [...this.chapters];
    }

    isChapterRead(chapterId) {
        const progress = JSON.parse(localStorage.getItem('mangaVerseProgress') || '{}');
        const key = this.mangaId;
        const mProgress = progress[key];
        return mProgress && mProgress.chapter > chapterId;
    }

    getReleaseDate(chapterId) {
        const baseDate = new Date('2016-02-15');
        const monthsToAdd = (chapterId - 1) * 2;
        baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
        return baseDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('volumeSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterChapters(e.target.value));
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }

    filterChapters(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredChapters = this.chapters.filter(chapter => 
            chapter.title.toLowerCase().includes(term) ||
            chapter.description.toLowerCase().includes(term) ||
            chapter.id.toString().includes(term)
        );
        this.renderChapters();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filter chapters
        switch(filter) {
            case 'read':
                this.filteredChapters = this.chapters.filter(chapter => chapter.status === 'read');
                break;
            case 'unread':
                this.filteredChapters = this.chapters.filter(chapter => chapter.status === 'unread');
                break;
            default:
                this.filteredChapters = [...this.chapters];
        }
        
        this.renderChapters();
    }

    renderChapters() {
        const chaptersGrid = document.getElementById('chaptersGrid');
        if (!chaptersGrid) return;

        chaptersGrid.innerHTML = '';

        this.filteredChapters.forEach(chapter => {
            const chapterCard = this.createChapterCard(chapter);
            chaptersGrid.appendChild(chapterCard);
        });
    }

    createChapterCard(chapter) {
        const card = document.createElement('div');
        card.className = `chapter-card ${chapter.status}`;
        card.innerHTML = `
            <div class="chapter-header">
                <div class="chapter-title">${chapter.title}</div>
                <div class="chapter-status ${chapter.status}">
                    ${chapter.status === 'read' ? 'Read' : 'Unread'}
                </div>
            </div>
            <div class="chapter-info">
                <p><strong>Release Date:</strong> ${chapter.releaseDate}</p>
                <p><strong>Pages:</strong> ${chapter.pages}</p>
                <p><strong>Rating:</strong> ⭐ ${chapter.rating}/10</p>
            </div>
            <div class="chapter-actions">
                <button class="chapter-btn primary" onclick="readChapter(${chapter.id})">
                    <i class="fas fa-play"></i> Read Now
                </button>
                <button class="chapter-btn secondary" onclick="markAsRead(${chapter.id})">
                    <i class="fas fa-check"></i> Mark as Read
                </button>
            </div>
        `;

        return card;
    }
}

// Global functions for chapter actions
function readChapter(chapterId) {
    // Check if user is logged in
    const userData = localStorage.getItem('mangaVerseUser');
    if (!userData) {
        if (confirm('Please login to continue reading. Would you like to login now?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Navigate to reader with specific chapter
    const urlParams = new URLSearchParams(window.location.search);
    const mangaId = urlParams.get('manga') || 'demon-slayer';
    window.location.href = `reader.html?manga=${encodeURIComponent(mangaId)}&chapter=${chapterId}&page=1`;
}

function markAsRead(chapterId) {
    // Check if user is logged in
    const userData = localStorage.getItem('mangaVerseUser');
    if (!userData) {
        if (confirm('Please login to mark chapters as read. Would you like to login now?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Update reading progress
    const progress = JSON.parse(localStorage.getItem('mangaVerseProgress') || '{}');
    const urlParams = new URLSearchParams(window.location.search);
    const mangaId = urlParams.get('manga') || 'demon-slayer';
    progress[mangaId] = {
        chapter: chapterId + 1,
        page: 1,
        timestamp: Date.now()
    };
    localStorage.setItem('mangaVerseProgress', JSON.stringify(progress));

    // Refresh the chapters display
    const chaptersManager = new ChaptersManager();
    chaptersManager.renderChapters();
}

// Initialize chapters manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ChaptersManager();
});
