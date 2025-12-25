  // Sample notes data
const sampleNotes = [
    {
        id: 1,
        title: "Welcome to NoteTaker!",
        content: "Welcome to your new note-taking application. You can create, edit, and organize your notes here. Try creating a new note by clicking the 'New Note' button.",
        category: "personal",
        tags: ["welcome", "introduction"],
        pinned: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        color: "#667eea"
    },
    {
        id: 2,
        title: "Meeting Notes - Q4 Planning",
        content: "Discussed project timeline and deliverables for Q4. Key points:\n1. Finalize UI designs by Friday\n2. Development sprint starts next Monday\n3. Review with stakeholders on Wednesday",
        category: "work",
        tags: ["meeting", "project", "planning"],
        pinned: false,
        createdAt: new Date(Date.now() - 86400000), // Yesterday
        updatedAt: new Date(Date.now() - 86400000),
        color: "#764ba2"
    },
    {
        id: 3,
        title: "Shopping List",
        content: "Weekly groceries:\n- Milk\n- Eggs\n- Bread\n- Coffee\n- Fruits (apples, bananas)\n- Vegetables\n- Chicken breast",
        category: "personal",
        tags: ["shopping", "todo"],
        pinned: false,
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000),
        color: "#4f46e5"
    },
    {
        id: 4,
        title: "Project Ideas",
        content: "Brainstorming session:\n1. Mobile app for note-taking\n2. AI-powered note organization\n3. Collaborative workspace feature\n4. Voice-to-note transcription",
        category: "ideas",
        tags: ["brainstorming", "ideas", "future"],
        pinned: true,
        createdAt: new Date(Date.now() - 259200000), // 3 days ago
        updatedAt: new Date(Date.now() - 259200000),
        color: "#10b981"
    },
    {
        id: 5,
        title: "To-Do List",
        content: "Tasks for this week:\n✓ Complete project proposal\n✓ Schedule team meeting\n• Prepare presentation\n• Review design mockups\n• Update documentation",
        category: "todo",
        tags: ["tasks", "weekly", "productivity"],
        pinned: false,
        createdAt: new Date(Date.now() - 345600000), // 4 days ago
        updatedAt: new Date(Date.now() - 345600000),
        color: "#f59e0b"
    }
];
// Application state
let notes = [...sampleNotes];
let currentCategory = 'all';
let currentTag = null;
let searchQuery = '';
let isDarkMode = false;
let quillEditor = null;
// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const appContainer = document.getElementById('appContainer');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const newNoteBtn = document.getElementById('newNoteBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const createFirstNoteBtn = document.getElementById('createFirstNoteBtn');
const totalNotesElement = document.getElementById('totalNotes');
const pinnedNotesElement = document.getElementById('pinnedNotes');
const editorModal = document.getElementById('editorModal');
const closeEditorBtn = document.getElementById('closeEditorBtn');
const cancelNoteBtn = document.getElementById('cancelNoteBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const noteForm = document.getElementById('noteForm');
const editorTitle = document.getElementById('editorTitle');
const noteTitleInput = document.getElementById('noteTitle');
const noteCategorySelect = document.getElementById('noteCategory');
const noteTagsInput = document.getElementById('noteTags');
const notePinnedCheckbox = document.getElementById('notePinned');
const exportModal = document.getElementById('exportModal');
const closeExportBtn = document.getElementById('closeExportBtn');
const cancelExportBtn = document.getElementById('cancelExportBtn');
const startExportBtn = document.getElementById('startExportBtn');
const exportLoading = document.getElementById('exportLoading');
// Initialize application
function initApp() {
    // Show loading screen initially
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        
        // Initialize Quill editor
        quillEditor = new Quill('#editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            },
            placeholder: 'Start typing your note here...'
        });
        
        // Load notes
        loadNotes();
        
        // Initialize event listeners
        initEventListeners();
        
        // Update Lucide icons
        lucide.createIcons();
    }, 1500);
}
// Load and display notes
function loadNotes() {
    // Clear existing notes
    notesGrid.innerHTML = '';
    
    // Filter notes based on category, tag, and search
    let filteredNotes = notes;
    
    // Filter by category
    if (currentCategory !== 'all') {
        filteredNotes = filteredNotes.filter(note => note.category === currentCategory);
    }
    
    // Filter by tag
    if (currentTag) {
        filteredNotes = filteredNotes.filter(note => note.tags.includes(currentTag));
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filteredNotes = filteredNotes.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.content.toLowerCase().includes(query) ||
            note.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }
    
    // Show/hide empty state
    if (filteredNotes.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        
        // Display filtered notes
        filteredNotes.forEach(note => {
            const noteCard = createNoteCard(note);
            notesGrid.appendChild(noteCard);
        });
    }
    
    // Update stats
    updateStats();
}
// Create a note card element
function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.dataset.id = note.id;
    
    // Format date
    const date = new Date(note.updatedAt);
    const timeAgo = getTimeAgo(date);
    
    // Create card HTML
    card.innerHTML = `
        <div class="note-header">
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
            ${note.pinned ? '<i class="fas fa-thumbtack note-pin"></i>' : ''}
        </div>
        <div class="note-content">
            ${escapeHtml(note.content.substring(0, 200))}${note.content.length > 200 ? '...' : ''}
        </div>
        <div class="note-footer">
            <span class="note-category">${note.category.charAt(0).toUpperCase() + note.category.slice(1)}</span>
            <span class="note-date">${timeAgo}</span>
        </div>
    `;
    
    // Add click event to edit note
    card.addEventListener('click', () => openEditor(note.id));
    
    return card;
}
// Update statistics
function updateStats() {
    const totalNotes = notes.length;
    const pinnedNotes = notes.filter(note => note.pinned).length;
    
    totalNotesElement.textContent = totalNotes;
    pinnedNotesElement.textContent = pinnedNotes;
}
// Open editor for new or existing note
function openEditor(noteId = null) {
    if (noteId) {
        // Edit existing note
        const note = notes.find(n => n.id === noteId);
        if (note) {
            editorTitle.textContent = 'Edit Note';
            noteTitleInput.value = note.title;
            quillEditor.setText(note.content);
            noteCategorySelect.value = note.category;
            noteTagsInput.value = note.tags.join(', ');
            notePinnedCheckbox.checked = note.pinned;
            
            // Store note ID for saving
            noteTitleInput.dataset.noteId = noteId;
        }
    } else {
        // Create new note
        editorTitle.textContent = 'New Note';
        noteTitleInput.value = '';
        quillEditor.setText('');
        noteCategorySelect.value = 'personal';
        noteTagsInput.value = '';
        notePinnedCheckbox.checked = false;
        
        // Clear stored note ID
        delete noteTitleInput.dataset.noteId;
    }
    
    // Show editor modal
    editorModal.style.display = 'flex';
    noteTitleInput.focus();
}
// Save note
function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = quillEditor.getText().trim();
    const category = noteCategorySelect.value;
    const tags = noteTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const pinned = notePinnedCheckbox.checked;
    
    // Validate
    if (!title) {
        Swal.fire('Error', 'Please enter a title for your note', 'error');
        return;
    }
    
    if (!content) {
        Swal.fire('Error', 'Please enter some content for your note', 'error');
        return;
    }
    
    const noteId = noteTitleInput.dataset.noteId;
    
    if (noteId) {
        // Update existing note
        const index = notes.findIndex(n => n.id === parseInt(noteId));
        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                title,
                content,
                category,
                tags,
                pinned,
                updatedAt: new Date()
            };
        }
    } else {
        // Create new note
        const newNote = {
            id: notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1,
            title,
            content,
            category,
            tags,
            pinned,
            createdAt: new Date(),
            updatedAt: new Date(),
            color: getRandomColor()
        };
        notes.unshift(newNote); // Add to beginning
    }
    
    // Close editor and refresh
    closeEditor();
    loadNotes();
    
    // Show success message
    Swal.fire({
        icon: 'success',
        title: noteId ? 'Note Updated' : 'Note Created',
        text: noteId ? 'Your note has been updated successfully!' : 'Your note has been created successfully!',
        timer: 1500,
        showConfirmButton: false
    });
}
// Close editor
function closeEditor() {
    editorModal.style.display = 'none';
    noteForm.reset();
    quillEditor.setText('');
}
// Initialize event listeners
function initEventListeners() {
    // Sidebar toggle
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    // Category selection
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            // Add active class to clicked
            item.classList.add('active');
            
            // Update current category
            currentCategory = item.dataset.category;
            currentTag = null; // Clear tag filter
            
            // Load notes with new filter
            loadNotes();
        });
    });
    // Tag selection
    document.querySelectorAll('.tag-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            document.querySelectorAll('.tag-item').forEach(i => i.classList.remove('active'));
            // Add active class to clicked
            item.classList.add('active');
            
            // Update current tag
            currentTag = item.dataset.tag;
            currentCategory = 'all'; // Switch to all notes view
            
            // Update category selection
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            document.querySelector('.category-item[data-category="all"]').classList.add('active');
            
            // Load notes with new filter
            loadNotes();
        });
    });
    // New note button
    newNoteBtn.addEventListener('click', () => openEditor());
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleDarkMode);
    // Export button
    exportBtn.addEventListener('click', () => {
        exportModal.style.display = 'flex';
    });
    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        loadNotes();
    });
    // Create first note button
    createFirstNoteBtn.addEventListener('click', () => openEditor());
    // Editor buttons
    closeEditorBtn.addEventListener('click', closeEditor);
    cancelNoteBtn.addEventListener('click', closeEditor);
    saveNoteBtn.addEventListener('click', saveNote);
    // Export modal buttons
    closeExportBtn.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });
    
    cancelExportBtn.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });
    
    startExportBtn.addEventListener('click', exportNotes);
    // Export option selection
    document.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.export-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });
    // Handle form submission
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveNote();
    });
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === editorModal) closeEditor();
        if (e.target === exportModal) exportModal.style.display = 'none';
    });
}
// Toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    
    const icon = themeToggleBtn.querySelector('i');
    const text = themeToggleBtn.querySelector('span');
    
    if (isDarkMode) {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
}
// Export notes
function exportNotes() {
    const format = document.querySelector('.export-option.active').dataset.format;
    const exportAll = document.getElementById('exportAll').checked;
    const includeMetadata = document.getElementById('includeMetadata').checked;
    const fileName = document.getElementById('exportFileName').value || 'notetaker-export';
    
    // Show loading
    exportModal.style.display = 'none';
    exportLoading.style.display = 'flex';
    
    // Get notes to export
    let notesToExport = exportAll ? notes : notes.filter(note => note.pinned);
    
    setTimeout(() => {
        exportLoading.style.display = 'none';
        
        // For demo purposes, show a success message
        // In a real application, you would generate the file here
        Swal.fire({
            icon: 'success',
            title: 'Export Complete',
            html: `
                <div style="text-align: left; padding: 10px;">
                    <p><strong>Format:</strong> ${format.toUpperCase()}</p>
                    <p><strong>Notes exported:</strong> ${notesToExport.length}</p>
                    <p><strong>File name:</strong> ${fileName}.${format}</p>
                    <p><strong>Metadata included:</strong> ${includeMetadata ? 'Yes' : 'No'}</p>
                </div>
            `,
            confirmButtonText: 'Download File'
        });
    }, 2000);
}
// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}
function getRandomColor() {
    const colors = ['#667eea', '#764ba2', '#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
    return colors[Math.floor(Math.random() * colors.length)];
}
// Menu functions (for footer links)
function setView(view) {
    // For demo purposes, show a message
    Swal.fire('Navigation', `Loading ${view} view...`, 'info');
}
function openSettings() {
    Swal.fire({
        title: 'Settings',
        html: `
            <div style="text-align: left;">
                <h4>Account Settings</h4>
                <p>Profile, privacy, and security settings</p>
                
                <h4>Display Settings</h4>
                <p>Theme, layout, and appearance</p>
                
                <h4>Notification Settings</h4>
                <p>Email and push notifications</p>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Close'
    });
}
function logout() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // In a real app, you would handle Firebase logout here
            Swal.fire({
                icon: 'success',
                title: 'Logged Out',
                text: 'You have been logged out successfully',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                // Redirect to login page
                // window.location.href = '/login';
            });
        }
    });
}
// Check for saved dark mode preference
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
    isDarkMode = true;
    document.body.classList.add('dark-mode');
    const icon = themeToggleBtn.querySelector('i');
    const text = themeToggleBtn.querySelector('span');
    icon.className = 'fas fa-sun';
    text.textContent = 'Light Mode';
}
// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);