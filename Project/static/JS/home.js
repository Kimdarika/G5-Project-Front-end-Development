let currentView = 'all';
let editingNoteId = null;
let autoSaveTimer = null;
let notes = JSON.parse(localStorage.getItem('saved-notes')) || [
    { 
        id: 1, 
        title: 'Q1 Revenue Growth', 
        content: 'Focus on expansion into the APAC region...', 
        tag: 'Strategy', 
        pinned: false, 
        starred: true, 
        color: 'transparent', 
        createdAt: new Date('2024-01-15').getTime(),
        deleted: false,
        deletedAt: null
    },
    { 
        id: 2, 
        title: 'Brand Guidelines v2', 
        content: 'Updated color palette including the new emerald...', 
        tag: 'Design', 
        pinned: false, 
        starred: false, 
        color: 'transparent', 
        createdAt: new Date('2024-01-10').getTime(),
        deleted: false,
        deletedAt: null
    },
    { 
        id: 3, 
        title: 'Weekly Team Meeting', 
        content: 'Discuss project timelines and resource allocation...', 
        tag: 'Meeting', 
        pinned: true, 
        starred: false, 
        color: '#3b82f6', 
        createdAt: new Date('2024-01-05').getTime(),
        deleted: false,
        deletedAt: null
    },
    { 
        id: 4, 
        title: 'Personal Goals 2024', 
        content: '1. Learn React Native\n2. Read 24 books\n3. Travel to Japan', 
        tag: 'Personal', 
        pinned: false, 
        starred: true, 
        color: '#f59e0b', 
        createdAt: new Date('2024-01-01').getTime(),
        deleted: false,
        deletedAt: null
    }
];

let tasks = JSON.parse(localStorage.getItem('saved-tasks')) || [
    { id: 1, text: 'Review PR for dashboard', done: false, createdAt: Date.now() },
    { id: 2, text: 'Weekly team sync', done: true, createdAt: Date.now() - 86400000 },
    { id: 3, text: 'Update documentation', done: false, createdAt: Date.now() - 172800000 }
];

let events = JSON.parse(localStorage.getItem('saved-events')) || [
    { id: 1, title: 'Design Review', time: '20m', date: new Date(Date.now() + 1200000).toISOString() },
    { id: 2, title: 'Client Meeting', time: '2:00 PM', date: new Date().setHours(14, 0, 0, 0) },
    { id: 3, title: 'Project Deadline', time: 'Tomorrow', date: new Date(Date.now() + 86400000).toISOString() }
];

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

function saveToLocalStorage() {
    localStorage.setItem('saved-notes', JSON.stringify(notes));
    localStorage.setItem('saved-tasks', JSON.stringify(tasks));
    localStorage.setItem('saved-events', JSON.stringify(events));
}

function refreshIcons() {
    lucide.createIcons();
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    document.getElementById('digitalClock').innerText = timeString;
}

const viewConfig = {
    'all': { icon: 'pin', text: 'My Notes', color: 'var(--primary)' },
    'starred': { icon: 'star', text: 'Starred Notes', color: '#fbbf24' },
    'pinned': { icon: 'pin', text: 'Pinned Notes', color: 'var(--primary)' },
    'recent': { icon: 'history', text: 'Recent Notes', color: 'var(--primary)' },
    'notebooks': { icon: 'folder', text: 'Notebooks', color: 'var(--primary)' },
    'archive': { icon: 'archive', text: 'Archived Notes', color: 'var(--primary)' },
    'trash': { icon: 'trash-2', text: 'Trash', color: 'var(--danger)' }
};

function setView(view) {
    currentView = view;
    const title = document.getElementById('gridTitle');
    const config = viewConfig[view];
    
    let titleHTML = `<i data-lucide="${config.icon}" style="color: ${config.color}"></i> ${config.text}`;
    
    // Add empty trash button for trash view
    if (view === 'trash') {
        const trashNotes = notes.filter(n => n.deleted);
        titleHTML += `
            <button class="btn-danger" onclick="emptyTrash()" 
                    style="margin-left: 20px; padding: 5px 15px;" 
                    ${trashNotes.length === 0 ? 'disabled' : ''}>
                <i data-lucide="trash-2"></i> Empty Trash (${trashNotes.length})
            </button>
        `;
    }
    
    title.innerHTML = titleHTML;
    
    updateNavLinks(view);
    renderNotes();
    refreshIcons();
}

function updateNavLinks(activeView) {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.nav-links a[onclick*="setView('${activeView}')"]`);
    if (activeLink) activeLink.classList.add('active');
}

function changeBg(color, btnElement = null) {
    document.documentElement.style.setProperty('--bg-dark', color);
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) || 0;
    const g = parseInt(hex.substr(2, 2), 16) || 0;
    const b = parseInt(hex.substr(4, 2), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness > 155) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    localStorage.setItem('notetaker-theme', color);
    if (btnElement) {
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }
}

function renderNotes(searchTerm = '') {
    const grid = document.getElementById('notesGrid');
    grid.innerHTML = '';
    let filteredNotes = filterNotesByView(notes, currentView);
    
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Only sort if not in trash view (trash is already sorted by deletion time)
    if (currentView !== 'trash') {
        filteredNotes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.createdAt - a.createdAt;
        });
    }
    
    if (filteredNotes.length === 0) {
        showEmptyState(grid, searchTerm);
    } else {
        filteredNotes.forEach(note => createNoteCard(grid, note));
    }
    
    updateNoteStats();
    refreshIcons();
}

function filterNotesByView(notesList, view) {
    switch(view) {
        case 'starred': 
            return notesList.filter(n => n.starred && !n.deleted);
        case 'pinned': 
            return notesList.filter(n => n.pinned && !n.deleted);
        case 'recent': 
            return notesList.filter(n => !n.deleted).sort((a, b) => b.createdAt - a.createdAt);
        case 'archive': 
            return notesList.filter(n => n.archived && !n.deleted);
        case 'trash': 
            return notesList.filter(n => n.deleted).sort((a, b) => b.deletedAt - a.deletedAt);
        default: 
            return notesList.filter(n => !n.deleted); // All notes excludes deleted
    }
}

function showEmptyState(grid, searchTerm) {
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i data-lucide="file-text" style="width: 64px; height: 64px; color: var(--text-dim); opacity: 0.3; margin-bottom: 20px;"></i>
            <h3 style="color: var(--text-dim); margin-bottom: 10px;">No notes found</h3>
            <p style="color: var(--text-dim); opacity: 0.7;">
                ${searchTerm ? 'Try a different search term' : (currentView === 'trash' ? 'Trash is empty' : 'Create your first note to get started!')}
            </p>
        </div>
    `;
}

function createNoteCard(grid, note) {
    const card = document.createElement('div');
    card.className = `note-card ${note.pinned ? 'pinned' : ''} ${note.deleted ? 'deleted' : ''}`;
    
    // Add visual indicator for deleted notes
    if (note.deleted) {
        card.style.opacity = '0.7';
        card.style.borderLeft = '3px solid var(--danger)';
    }
    
    if (note.color && note.color !== 'transparent') {
        card.style.borderTop = `4px solid ${note.color}`;
    }
    
    const timeAgo = note.deleted 
        ? getTimeAgo(new Date(note.deletedAt))
        : getTimeAgo(new Date(note.createdAt));
    
    // Different actions based on view
    let actionButtons = '';
    if (currentView === 'trash') {
        actionButtons = `
            <div class="note-actions">
                <i data-lucide="refresh-cw" class="icon-btn restore-btn" 
                   onclick="restoreNote(${note.id})" title="Restore"></i>
                <i data-lucide="trash-2" class="icon-btn delete-btn" 
                   onclick="permanentDeleteNote(${note.id})" title="Permanently delete"></i>
            </div>
        `;
    } else if (!note.deleted) {
        actionButtons = `
            <div class="note-actions">
                <i data-lucide="palette" class="icon-btn" onclick="changeNoteColor(${note.id})"></i>
                <i data-lucide="pin" class="icon-btn ${note.pinned ? 'active' : ''}" onclick="togglePin(${note.id})"></i>
                <i data-lucide="star" class="icon-btn ${note.starred ? 'active' : ''}" 
                   onclick="toggleStar(${note.id})" 
                   style="${note.starred ? 'color:#fbbf24; fill:#fbbf24' : ''}">
                </i>
                <i data-lucide="edit-3" class="icon-btn" onclick="editNote(${note.id})"></i>
                <i data-lucide="trash-2" class="icon-btn delete-btn" onclick="deleteNote(${note.id})"></i>
            </div>
        `;
    }
    
    // Add deleted indicator to title
    const titleText = note.deleted ? `${note.title} (Deleted)` : note.title;
    
    card.innerHTML = `
        <div class="note-header">
            <span class="tag-pill ${note.deleted ? 'deleted-tag' : ''}">${note.tag}</span>
            ${actionButtons}
        </div>
        <h4>${titleText}</h4>
        <p>${note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content}</p>
        <div class="note-footer">
            <small>${note.deleted ? 'Deleted ' : ''}${timeAgo}</small>
            ${note.color && note.color !== 'transparent' ? 
                `<div class="color-indicator" style="background: ${note.color}"></div>` : ''}
        </div>
    `;
    
    grid.appendChild(card);
}

function editNote(id) {
    openNoteModal(id);
}

function deleteNote(id) {
    if (confirm("Move this note to trash?")) {
        const noteIndex = notes.findIndex(n => n.id === id);
        if (noteIndex !== -1) {
            // Add deletion tracking
            notes[noteIndex].deleted = true;
            notes[noteIndex].deletedAt = Date.now();
            notes[noteIndex].updatedAt = Date.now();
            
            // Remove pinned/starred status when deleted
            notes[noteIndex].pinned = false;
            notes[noteIndex].starred = false;
            
            saveAndRefresh();
        }
    }
}

function restoreNote(id) {
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex].deleted = false;
        notes[noteIndex].restoredAt = Date.now();
        notes[noteIndex].updatedAt = Date.now();
        saveAndRefresh();
    }
}

function permanentDeleteNote(id) {
    if (confirm("Permanently delete this note? This action cannot be undone.")) {
        notes = notes.filter(note => note.id !== id);
        saveAndRefresh();
    }
}

function emptyTrash() {
    const trashNotes = notes.filter(n => n.deleted);
    if (trashNotes.length === 0) return;
    
    if (confirm(`Empty the trash? This will permanently delete ${trashNotes.length} note(s). This action cannot be undone.`)) {
        notes = notes.filter(note => !note.deleted);
        saveAndRefresh();
    }
}

function togglePin(id) {
    const note = notes.find(n => n.id === id);
    if (note && !note.deleted) {
        note.pinned = !note.pinned;
        note.updatedAt = Date.now();
        saveAndRefresh();
    }
}

function toggleStar(id) {
    const note = notes.find(n => n.id === id);
    if (note && !note.deleted) {
        note.starred = !note.starred;
        note.updatedAt = Date.now();
        saveAndRefresh();
    }
}

function changeNoteColor(id) {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', 'transparent'];
    const note = notes.find(n => n.id === id);
    
    if (note && !note.deleted) {
        const currentIndex = colors.indexOf(note.color || 'transparent');
        const nextIndex = (currentIndex + 1) % colors.length;
        note.color = colors[nextIndex];
        note.updatedAt = Date.now();
        saveAndRefresh();
    }
}

function renderTasks() {
    const list = document.getElementById('todoList');
    list.innerHTML = '';
    const sortedTasks = [...tasks].sort((a, b) => b.createdAt - a.createdAt);
    
    sortedTasks.forEach(task => {
        const row = document.createElement('div');
        row.className = 'todo-row';
        const timeAgo = getTimeAgo(new Date(task.createdAt));
        
        row.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <span class="${task.done ? 'done' : ''}">${task.text}</span>
            <small>${timeAgo}</small>
            <i data-lucide="x" onclick="deleteTask(${task.id})"></i>
        `;
        list.appendChild(row);
    });
    document.getElementById('totalTasksCount').innerText = tasks.length;
    updateProductivityText();
    refreshIcons();
}

function addNewTask() {
    const taskText = prompt("Task:");
    if (taskText) {
        tasks.push({
            id: Date.now(),
            text: taskText,
            done: false,
            createdAt: Date.now()
        });
        saveAndRefresh();
    }
}

function toggleTask(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, done: !task.done, updatedAt: Date.now() } : task
    );
    saveAndRefresh();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveAndRefresh();
}

function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.done);
    saveAndRefresh();
}

function renderEvents() {
    const container = document.getElementById('upcomingEventsList');
    container.innerHTML = '';
    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    sortedEvents.forEach(event => {
        const div = document.createElement('div');
        div.className = 'event-item';
        const eventDate = new Date(event.date);
        const now = new Date();
        const diffHours = Math.floor((eventDate - now) / 3600000);
        let timeText = event.time;
        if (diffHours > 0 && diffHours < 24) {
            timeText = `In ${diffHours}h`;
        } else if (diffHours >= 24) {
            const days = Math.floor(diffHours / 24);
            timeText = `In ${days}d`;
        }
        div.innerHTML = `
            <p class="event-time">${timeText}</p>
            <p class="event-title">${event.title}</p>
            <span class="event-remove" onclick="deleteEvent(${event.id})">Remove</span>
        `;
        container.appendChild(div);
    });
    document.getElementById('totalEventsCount').innerText = events.length;
}

function addNewEvent() {
    const title = prompt("Event Name:");
    if (!title) return;
    const dateStr = prompt("Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    const timeStr = prompt("Time (HH:MM):", "14:00");
    if (dateStr && timeStr) {
        const dateTime = new Date(`${dateStr}T${timeStr}`);
        const timeDiff = dateTime - new Date();
        let timeDisplay = '';
        
        if (timeDiff < 3600000) {
            timeDisplay = `${Math.floor(timeDiff / 60000)}m`;
        } else if (timeDiff < 86400000) {
            timeDisplay = `${Math.floor(timeDiff / 3600000)}h`;
        } else {
            timeDisplay = `${Math.floor(timeDiff / 86400000)}d`;
        }
        events.push({
            id: Date.now(),
            title,
            time: timeDisplay,
            date: dateTime.toISOString()
        });
        saveAndRefresh();
    }
}

function deleteEvent(id) {
    events = events.filter(event => event.id !== id);
    saveAndRefresh();
}

function updateProductivityText() {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    const pending = total - done;
    const textElement = document.getElementById('productiveCount');
    const progressBar = document.getElementById('taskProgressBar');
    
    if (pending === 0 && total > 0) {
        textElement.innerText = "All caught up! ✨";
    } else if (total === 0) {
        textElement.innerText = "No tasks for today.";
    } else {
        textElement.innerText = `You have ${pending} tasks waiting.`;
    }
    const percentage = total === 0 ? 0 : (done / total) * 100;
    progressBar.style.width = `${percentage}%`;
}

function updateNoteStats() {
    const activeNotes = notes.filter(n => !n.deleted);
    const totalNotes = activeNotes.length;
    const pinnedNotes = activeNotes.filter(n => n.pinned).length;
    const starredNotes = activeNotes.filter(n => n.starred).length;
    const trashNotes = notes.filter(n => n.deleted).length;
    
    document.getElementById('totalNotesStat').innerText = totalNotes;
    document.getElementById('pinnedNotesStat').innerText = pinnedNotes;
    document.getElementById('starredNotesStat').innerText = starredNotes;
    document.getElementById('totalNotesCount').innerText = totalNotes;
    
    // Update trash count if you have a trash indicator in the sidebar
    const trashNavItem = document.querySelector('.nav-links a[onclick*="setView(\'trash\')"]');
    if (trashNavItem) {
        // Find the trash icon and add count badge
        const trashIcon = trashNavItem.querySelector('i[data-lucide="trash-2"]');
        if (trashIcon) {
            // Remove existing badge
            const existingBadge = trashIcon.parentNode.querySelector('.trash-badge');
            if (existingBadge) existingBadge.remove();
            
            if (trashNotes > 0) {
                const badge = document.createElement('span');
                badge.className = 'trash-badge';
                badge.textContent = trashNotes;
                badge.style.cssText = `
                    background: var(--danger);
                    color: white;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 11px;
                    margin-left: 5px;
                    display: inline-block;
                `;
                trashIcon.parentNode.insertBefore(badge, trashIcon.nextSibling);
            }
        }
    }
}

function openNoteModal(noteId = null) {
    editingNoteId = noteId;
    const modal = document.getElementById('noteModal');
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    const tagInput = document.getElementById('noteTag');
    const modalTitle = document.getElementById('modalTitle');
    
    if (noteId) {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            titleInput.value = note.title;
            contentInput.value = note.content;
            tagInput.value = note.tag;
            modalTitle.innerText = 'Edit Note';
        }
    } else {
        titleInput.value = '';
        contentInput.value = '';
        tagInput.value = 'General';
        modalTitle.innerText = 'New Note';
    }
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.animation = 'fadeIn 0.3s ease-out';
        titleInput.focus();
    }, 10);
    refreshIcons();
}

function closeModal() {
    const modal = document.getElementById('noteModal');
    modal.style.animation = 'fadeIn 0.3s ease-out reverse';
    setTimeout(() => {
        modal.style.display = 'none';
        editingNoteId = null;
    }, 300);
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    const nameInput = document.getElementById('userNameInput');
    const autoSaveSelect = document.getElementById('autoSaveInterval');
    const defaultViewSelect = document.getElementById('defaultView');
    
    nameInput.value = localStorage.getItem('notetaker-user') || 'Darika Kim';
    autoSaveSelect.value = localStorage.getItem('notetaker-autosave') || '30';
    defaultViewSelect.value = localStorage.getItem('notetaker-default-view') || 'all';
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.animation = 'fadeIn 0.3s ease-out';
    }, 10);
    refreshIcons();
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.style.animation = 'fadeIn 0.3s ease-out reverse';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function saveSettings() {
    const nameInput = document.getElementById('userNameInput');
    const autoSaveSelect = document.getElementById('autoSaveInterval');
    const defaultViewSelect = document.getElementById('defaultView');
    
    if (nameInput.value.trim()) {
        document.getElementById('userName').innerText = `Welcome back, ${nameInput.value} 👋`;
        localStorage.setItem('notetaker-user', nameInput.value);
    }
    
    localStorage.setItem('notetaker-autosave', autoSaveSelect.value);
    localStorage.setItem('notetaker-default-view', defaultViewSelect.value);
    
    setupAutoSave();
    setView(defaultViewSelect.value);
    closeSettingsModal();
}

function saveNote() {
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    const tagInput = document.getElementById('noteTag');
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const tag = tagInput.value;
    
    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }
    
    if (editingNoteId) {
        const noteIndex = notes.findIndex(n => n.id === editingNoteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = {
                ...notes[noteIndex],
                title,
                content,
                tag,
                updatedAt: Date.now()
            };
        }
    } else {
        notes.push({
            id: Date.now(),
            title,
            content,
            tag,
            pinned: false,
            starred: false,
            color: 'transparent',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            deleted: false,
            deletedAt: null
        });
    }
    
    saveAndRefresh();
    closeModal();
}

function quickAdd(type) {
    if (type === 'note') {
        openNoteModal();
    } else if (type === 'task') {
        addNewTask();
    }
}

function exportData() {
    const data = {
        notes,
        tasks,
        events,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notetaker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm('This will replace all your current data. Continue?')) {
                    if (data.notes) notes = data.notes;
                    if (data.tasks) tasks = data.tasks;
                    if (data.events) events = data.events;
                    
                    saveAndRefresh();
                    alert('Data imported successfully!');
                }
            } catch (error) {
                alert('Error importing data. Invalid file format.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('notetaker-user');
        localStorage.removeItem('notetaker-theme');
        document.getElementById('userName').innerText = 'Welcome back, Guest 👋';
        alert('Logged out successfully!');
    }
}

function setupAutoSave() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
    const interval = parseInt(localStorage.getItem('notetaker-autosave') || '30') * 1000;
    if (interval >= 5000) {
        autoSaveTimer = setInterval(() => {
            saveAndRefresh();
            console.log('Auto-saved at', new Date().toLocaleTimeString());
        }, interval);
    }
}

function saveAndRefresh() {
    saveToLocalStorage();
    renderNotes();
    renderTasks();
    renderEvents();
    updateNoteStats();
}

function filterNotes() {
    const searchTerm = document.getElementById('searchInput').value;
    renderNotes(searchTerm);
}

window.addEventListener('DOMContentLoaded', () => {
    const savedColor = localStorage.getItem('notetaker-theme');
    const savedUser = localStorage.getItem('notetaker-user');
    const savedDefaultView = localStorage.getItem('notetaker-default-view') || 'all';
    
    if (savedColor) changeBg(savedColor);
    if (savedUser) {
        document.getElementById('userName').innerText = `Welcome back, ${savedUser} 👋`;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
    
    setupAutoSave();
    setView(savedDefaultView);
    saveAndRefresh();
    refreshIcons();
    
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeSettingsModal();
        }
    });
    
    document.querySelectorAll('.nav-section').forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Expose functions to global scope
    window.setView = setView;
    window.changeBg = changeBg;
    window.openNoteModal = openNoteModal;
    window.closeModal = closeModal;
    window.saveNote = saveNote;
    window.editNote = editNote;
    window.deleteNote = deleteNote;
    window.restoreNote = restoreNote;
    window.permanentDeleteNote = permanentDeleteNote;
    window.emptyTrash = emptyTrash;
    window.togglePin = togglePin;
    window.toggleStar = toggleStar;
    window.changeNoteColor = changeNoteColor;
    window.addNewTask = addNewTask;
    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;
    window.clearCompletedTasks = clearCompletedTasks;
    window.addNewEvent = addNewEvent;
    window.deleteEvent = deleteEvent;
    window.quickAdd = quickAdd;
    window.exportData = exportData;
    window.importData = importData;
    window.logout = logout;
    window.openSettings = openSettings;
    window.closeSettingsModal = closeSettingsModal;
    window.saveSettings = saveSettings;
    window.filterNotes = filterNotes;
});