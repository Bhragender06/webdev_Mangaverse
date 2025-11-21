// Lightweight data + renderer for the built-in novel library.
// Each entry maps directly to a PDF living under the /novels folder.
const NOVEL_LIBRARY = [
    {
        id: 'before-i-let-go',
        title: 'Before I Let Go',
        description: 'A tender second-chance romance about love, grief, and healing.',
        format: 'PDF',
        pagesLabel: 'Preview',
        tags: ['Romance', 'Contemporary'],
        genres: ['romance', 'contemporary', 'drama'],
        file: 'novels/BeforeILetGo-Excerpt.pdf'
    },
    {
        id: 'it-starts-with-us',
        title: 'It Starts with Us',
        description: 'Colleen Hoover’s heartfelt sequel about brave choices and new beginnings.',
        format: 'PDF',
        pagesLabel: 'Full',
        tags: ['Drama', 'Romance'],
        genres: ['romance', 'drama'],
        file: 'novels/It-Starts-with-Us.pdf'
    },
    {
        id: 'percy-jackson-1',
        title: 'Percy Jackson #1 (Graphic Edition)',
        description: 'Percy’s first quest retold with bold visuals and modern myth energy.',
        format: 'PDF',
        pagesLabel: 'Graphic',
        tags: ['Fantasy', 'Adventure'],
        genres: ['fantasy', 'adventure', 'ya'],
        file: 'novels/percy-jackson-1-graphic-novel-pdf-free.pdf'
    },
    {
        id: 'the-road',
        title: 'The Road',
        description: 'McCarthy’s haunting post-apocalyptic journey of a father and son.',
        format: 'PDF',
        pagesLabel: 'Classic',
        tags: ['Dystopian', 'Literary'],
        genres: ['dystopian', 'literary', 'drama'],
        file: 'novels/the_road_-_text.pdf'
    },
    {
        id: 'the-terror',
        title: 'The Terror',
        description: 'A chilling retelling of the doomed Arctic expedition soaked in dread.',
        format: 'PDF',
        pagesLabel: 'Thriller',
        tags: ['Horror', 'Historical'],
        genres: ['horror', 'historical', 'thriller'],
        file: 'novels/The-Terror-novel-PDFnovel.pdf'
    },
    {
        id: 'hp-chamber-of-secrets',
        title: 'Harry Potter & the Chamber of Secrets',
        description: 'Return to Hogwarts as a dark mystery stalks the castle corridors.',
        format: 'PDF',
        pagesLabel: 'Wizarding',
        tags: ['Fantasy', 'YA'],
        genres: ['fantasy', 'ya'],
        file: 'novels/Harry-Potter-And-The-Chamber-Of-Secrets-J-K-Rowling(www.torengine.cc) (1).pdf'
    }
];

const formatTag = (label, className = '') => `
    <span class="${className}">${label}</span>
`;

const buildNovelCard = (novel) => `
    <article class="novel-card" data-novel="${novel.id}">
        <div class="novel-meta">
            <span class="novel-format">${novel.format}</span>
            <span class="novel-pages">${novel.pagesLabel}</span>
        </div>
        <h4>${novel.title}</h4>
        <p>${novel.description}</p>
        <div class="novel-tags">
            ${novel.tags.map(tag => formatTag(tag, 'tag')).join('')}
        </div>
        <div class="novel-actions">
            <a class="novel-btn primary" href="${novel.file}" target="_blank" rel="noopener">Read PDF</a>
            <a class="novel-btn secondary" href="${novel.file}" download>Download</a>
        </div>
    </article>
`;

function renderGrid(gridEl, novels) {
    if (!gridEl) return;
    const limit = parseInt(gridEl.dataset.novelLimit || `${novels.length}`, 10);
    const safeLimit = Number.isNaN(limit) || limit <= 0 ? novels.length : limit;
    const filtered = novels.slice(0, safeLimit);

    if (!filtered.length) {
        gridEl.innerHTML = `
            <p class="empty-copy">No novels match this filter yet. Check back soon!</p>
        `;
        return;
    }

    gridEl.innerHTML = filtered.map(buildNovelCard).join('');
}

function applyFilter(filterValue) {
    const normalized = filterValue?.toLowerCase() || 'all';
    const matchingNovels = normalized === 'all'
        ? NOVEL_LIBRARY
        : NOVEL_LIBRARY.filter(novel => novel.genres.includes(normalized));

    document.querySelectorAll('[data-novel-grid]').forEach(grid => {
        const gridFilter = grid.dataset.novelFilter || normalized;
        const source = gridFilter === 'all'
            ? matchingNovels
            : matchingNovels.filter(novel => novel.genres.includes(gridFilter));
        renderGrid(grid, source);
    });
}

function bootstrapNovelLibrary() {
    document.querySelectorAll('[data-novel-grid]').forEach(grid => {
        const defaultFilter = grid.dataset.novelFilter || 'all';
        const initialSelection = defaultFilter === 'all'
            ? NOVEL_LIBRARY
            : NOVEL_LIBRARY.filter(novel => novel.genres.includes(defaultFilter));
        renderGrid(grid, initialSelection);
    });

    document.querySelectorAll('[data-novel-filter]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-novel-filter]').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyFilter(button.dataset.novelFilter);
        });
    });

    const countTarget = document.querySelector('[data-novel-count]');
    if (countTarget) {
        countTarget.textContent = `${NOVEL_LIBRARY.length} PDFs`;
    }

    const genreTarget = document.querySelector('[data-novel-genres]');
    if (genreTarget) {
        const genres = new Set(NOVEL_LIBRARY.flatMap(novel => novel.genres));
        genreTarget.textContent = Array.from(genres)
            .slice(0, 5)
            .map(genre => genre.charAt(0).toUpperCase() + genre.slice(1))
            .join(', ');
    }
}

document.addEventListener('DOMContentLoaded', bootstrapNovelLibrary);

