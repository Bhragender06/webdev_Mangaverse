// MangaVerse Todo App Logic
(function() {
    const STORAGE_KEY = 'mangaverse_todos_v1';

    const els = {
        list: document.getElementById('todoList'),
        addForm: document.getElementById('addTaskForm'),
        title: document.getElementById('taskTitle'),
        month: document.getElementById('taskMonth'),
        priority: document.getElementById('taskPriority'),
        description: document.getElementById('taskDescription'),
        filters: document.querySelectorAll('.filter-btn'),
        stats: {
            total: document.getElementById('totalTasks'),
            completed: document.getElementById('completedTasks'),
            inProgress: document.getElementById('inProgressTasks'),
            rate: document.getElementById('completionRate'),
        },
        modal: document.getElementById('taskModal'),
        closeModal: document.getElementById('closeModal'),
        cancelEdit: document.getElementById('cancelEdit'),
        editForm: document.getElementById('editTaskForm'),
        editFields: {
            title: document.getElementById('editTaskTitle'),
            description: document.getElementById('editTaskDescription'),
            month: document.getElementById('editTaskMonth'),
            priority: document.getElementById('editTaskPriority'),
            status: document.getElementById('editTaskStatus'),
        },
        timeline: document.getElementById('timeline'),
    };

    let todos = loadTodos();
    let currentFilter = 'all';
    let editingId = null;

    // Seed defaults if none
    if (todos.length === 0) {
        todos = seedDefaults();
        saveTodos();
    }

    bindEvents();
    renderAll();

    function bindEvents() {
        els.addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const task = buildTask({
                title: els.title.value.trim(),
                month: els.month.value,
                priority: els.priority.value,
                description: els.description.value.trim(),
            });
            if (!task.title || !task.month) return;
            todos.push(task);
            saveTodos();
            els.addForm.reset();
            renderAll();
        });

        els.filters.forEach(btn => btn.addEventListener('click', () => {
            els.filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderList();
        }));

        els.closeModal.addEventListener('click', hideModal);
        els.cancelEdit.addEventListener('click', hideModal);

        els.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!editingId) return;
            const idx = todos.findIndex(t => t.id === editingId);
            if (idx === -1) return;
            const t = todos[idx];
            t.title = els.editFields.title.value.trim();
            t.description = els.editFields.description.value.trim();
            t.month = els.editFields.month.value;
            t.priority = els.editFields.priority.value;
            t.status = els.editFields.status.value;
            saveTodos();
            hideModal();
            renderAll();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hideModal();
        });

        els.modal.addEventListener('click', (e) => {
            if (e.target === els.modal) hideModal();
        });
    }

    function renderAll() {
        renderList();
        renderStats();
        renderTimeline();
    }

    function renderList() {
        const fragment = document.createDocumentFragment();
        const filtered = filterTodos(todos, currentFilter);
        els.list.innerHTML = '';
        filtered.forEach(t => fragment.appendChild(renderItem(t)));
        els.list.appendChild(fragment);
    }

    function renderItem(t) {
        const wrapper = document.createElement('div');
        wrapper.className = 'todo-item';
        wrapper.innerHTML = `
            <div class="todo-left">
                <span class="status-dot status-${t.status}"></span>
                <div>
                    <div class="todo-title">${escapeHtml(t.title)}</div>
                    <div class="todo-meta">${formatMonth(t.month)} • <span class="badge ${t.priority}">${capitalize(t.priority)}</span> • ${capitalize(t.status.replace('_', ' '))}</div>
                    ${t.description ? `<div class=\"todo-desc\">${escapeHtml(t.description)}</div>` : ''}
                </div>
            </div>
            <div class="todo-actions">
                <button class="action-btn" data-act="toggle" title="Toggle status"><i class="fas fa-check"></i></button>
                <button class="action-btn" data-act="edit" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="action-btn" data-act="delete" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;

        wrapper.querySelector('[data-act="toggle"]').addEventListener('click', () => toggleStatus(t.id));
        wrapper.querySelector('[data-act="edit"]').addEventListener('click', () => openEdit(t.id));
        wrapper.querySelector('[data-act="delete"]').addEventListener('click', () => removeTask(t.id));

        return wrapper;
    }

    function renderStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.status === 'completed').length;
        const inProgress = todos.filter(t => t.status === 'in_progress').length;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
        els.stats.total.textContent = String(total);
        els.stats.completed.textContent = String(completed);
        els.stats.inProgress.textContent = String(inProgress);
        els.stats.rate.textContent = rate + '%';
    }

    function renderTimeline() {
        const months = ['month1','month2','month3','month4','month5','month6'];
        els.timeline.innerHTML = '';
        months.forEach(m => {
            const card = document.createElement('div');
            card.className = 'timeline-card';
            const list = todos.filter(t => t.month === m).slice(0, 6);
            card.innerHTML = `
                <div class="timeline-title">${formatMonth(m)}</div>
                <ul class="timeline-list">
                    ${list.map(t => `<li>${escapeHtml(t.title)}</li>`).join('') || '<li>No tasks yet</li>'}
                </ul>
            `;
            els.timeline.appendChild(card);
        });
    }

    function toggleStatus(id) {
        const t = todos.find(x => x.id === id);
        if (!t) return;
        if (t.status === 'pending') t.status = 'in_progress';
        else if (t.status === 'in_progress') t.status = 'completed';
        else t.status = 'pending';
        saveTodos();
        renderAll();
    }

    function openEdit(id) {
        const t = todos.find(x => x.id === id);
        if (!t) return;
        editingId = id;
        els.editFields.title.value = t.title;
        els.editFields.description.value = t.description || '';
        els.editFields.month.value = t.month;
        els.editFields.priority.value = t.priority;
        els.editFields.status.value = t.status;
        showModal();
    }

    function removeTask(id) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderAll();
    }

    function showModal() { els.modal.classList.add('show'); }
    function hideModal() { els.modal.classList.remove('show'); editingId = null; }

    // Helpers
    function buildTask({ title, month, priority, description }) {
        return {
            id: 't_' + Math.random().toString(36).slice(2, 10),
            title,
            description,
            month,
            priority: priority || 'medium',
            status: 'pending',
            createdAt: Date.now(),
        };
    }

    function filterTodos(items, filter) {
        if (filter === 'all') return items;
        if (['pending','in_progress','completed'].includes(filter)) {
            return items.filter(t => t.status === filter);
        }
        if (/^month[1-6]$/.test(filter)) {
            return items.filter(t => t.month === filter);
        }
        return items;
    }

    function saveTodos() { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }
    function loadTodos() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }

    function seedDefaults() {
        return [
            { title: 'Setup repo and project structure', month: 'month1', priority: 'high' },
            { title: 'Create registration page', month: 'month1', priority: 'high' },
            { title: 'Design DB schema', month: 'month2', priority: 'high' },
            { title: 'Implement auth APIs', month: 'month2', priority: 'critical' },
            { title: 'Admin panel scaffold', month: 'month3', priority: 'medium' },
            { title: 'Manga upload flow', month: 'month3', priority: 'high' },
            { title: 'Reader UI improvements', month: 'month4', priority: 'medium' },
            { title: 'Bookmarks & comments', month: 'month4', priority: 'medium' },
            { title: 'Ratings & reviews', month: 'month5', priority: 'medium' },
            { title: 'Notifications system', month: 'month5', priority: 'high' },
            { title: 'Prod deployment', month: 'month6', priority: 'critical' },
            { title: 'Monitoring & docs', month: 'month6', priority: 'high' },
        ].map(x => buildTask(x));
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function formatMonth(m) {
        const map = { month1: 'Month 1', month2: 'Month 2', month3: 'Month 3', month4: 'Month 4', month5: 'Month 5', month6: 'Month 6' };
        return map[m] || m;
    }
    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    }
})();


