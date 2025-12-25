// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyABC123def456ghi789jkl0mnopqr123stuv",
  authDomain: "g5-project-front-end.firebaseapp.com",
  projectId: "g5-project-front-end",
  storageBucket: "g5-project-front-end.appspot.com",
  messagingSenderId: "646526872882",
  appId: "1:646526872882:web:abc123def456ghi789jkl0",
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const auth = firebase.auth();
const db = firebase.firestore();

// App State
let currentUser = null;
let notes = [];
let trashNotes = [];
let currentCategory = "all";
let currentTag = null;
let searchQuery = "";
let isEditing = false;
let currentNoteId = null;
let isOnline = navigator.onLine;
let quill;
let currentTheme = localStorage.getItem("theme") || "light";

// DOM Elements
const appContainer = document.getElementById("appContainer");
const sidebar = document.getElementById("sidebar");
const toggleSidebar = document.getElementById("toggleSidebar");
const newNoteBtn = document.getElementById("newNoteBtn");
const searchInput = document.getElementById("searchInput");
const notesGrid = document.getElementById("notesGrid");
const emptyState = document.getElementById("emptyState");
const editorModal = document.getElementById("editorModal");
const editorTitle = document.getElementById("editorTitle");
const noteTitle = document.getElementById("noteTitle");
const noteCategory = document.getElementById("noteCategory");
const noteTags = document.getElementById("noteTags");
const notePinned = document.getElementById("notePinned");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const cancelNoteBtn = document.getElementById("cancelNoteBtn");
const closeEditorBtn = document.getElementById("closeEditorBtn");
const createFirstNoteBtn = document.getElementById("createFirstNoteBtn");
const exportBtn = document.getElementById("exportBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const totalNotesEl = document.getElementById("totalNotes");
const pinnedNotesEl = document.getElementById("pinnedNotes");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

// Export Modal Elements
const exportModal = document.getElementById("exportModal");
const closeExportBtn = document.getElementById("closeExportBtn");
const cancelExportBtn = document.getElementById("cancelExportBtn");
const startExportBtn = document.getElementById("startExportBtn");
const exportOptions = document.querySelectorAll(".export-option");
const exportAllCheckbox = document.getElementById("exportAll");
const includeMetadataCheckbox = document.getElementById("includeMetadata");
const exportFileNameInput = document.getElementById("exportFileName");
const exportLoading = document.getElementById("exportLoading");

// TODO Feature Elements (Fixed)
const taskPanel = document.getElementById("taskPanel");
const todoListContainer = document.getElementById("todoListContainer");
const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const pendingTasksEl = document.getElementById("pendingTasks");
const overdueTasksEl = document.getElementById("overdueTasks");
const createFirstTodoBtn = document.getElementById("createFirstTodoBtn");
const todoEditorModal = document.getElementById("todoEditorModal");
const todoEditorTitle = document.getElementById("todoEditorTitle");
const todoTitle = document.getElementById("todoTitle");
const todoDescription = document.getElementById("todoDescription");
const todoCategory = document.getElementById("todoCategory");
const todoTags = document.getElementById("todoTags");
const todoPinned = document.getElementById("todoPinned");
const todoListEditor = document.getElementById("todoListEditor");
const saveTodoBtn = document.getElementById("saveTodoBtn");
const cancelTodoBtn = document.getElementById("cancelTodoBtn");
const closeTodoBtn = document.getElementById("closeTodoBtn");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskModal = document.getElementById("taskModal");
const taskModalTitle = document.getElementById("taskModalTitle");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");
const closeTaskBtn = document.getElementById("closeTaskBtn");
const taskTitle = document.getElementById("taskTitle");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");

const todoManager = {
  todos: [],
  tasks: [],

  load() {
    const savedTodos = localStorage.getItem("nexus_todos");
    const savedTasks = localStorage.getItem("nexus_tasks");

    this.todos = savedTodos ? JSON.parse(savedTodos) : [];
    this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    console.log(
      `Loaded ${this.todos.length} todos and ${this.tasks.length} tasks`
    );
  },

  save() {
    localStorage.setItem("nexus_todos", JSON.stringify(this.todos));
    localStorage.setItem("nexus_tasks", JSON.stringify(this.tasks));
    console.log("Saved todos and tasks to localStorage");
  },

  addTodo(todoData) {
    const todo = {
      id: generateId(),
      ...todoData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: currentUser?.uid || "offline-user",
    };
    this.todos.push(todo);
    this.save();
    console.log("Added todo:", todo.id);
    return todo;
  },

  updateTodo(id, updates) {
    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index !== -1) {
      this.todos[index] = {
        ...this.todos[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      console.log("Updated todo:", id);
      return this.todos[index];
    }
    return null;
  },

  deleteTodo(id) {
    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index !== -1) {
      this.todos.splice(index, 1);

      // Delete all associated tasks
      this.tasks = this.tasks.filter((task) => task.todoId !== id);

      this.save();
      console.log("Deleted todo and its tasks:", id);
      return true;
    }
    return false;
  },

  addTask(todoId, taskData) {
    const task = {
      id: generateId(),
      todoId,
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    this.tasks.push(task);
    this.save();
    console.log("Added task:", task.id);
    return task;
  },

  updateTask(id, updates) {
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index !== -1) {
      this.tasks[index] = {
        ...this.tasks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      console.log("Updated task:", id);
      return this.tasks[index];
    }
    return null;
  },

  deleteTask(id) {
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      this.save();
      console.log("Deleted task:", id);
      return true;
    }
    return false;
  },

  getTodosByUserId(userId) {
    return this.todos.filter((todo) => todo.userId === userId);
  },

  getTasksByTodoId(todoId) {
    return this.tasks.filter((task) => task.todoId === todoId);
  },

  getTaskStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const overdue = this.tasks.filter((task) => {
      if (!task.dueDate || task.completed) return false;
      return new Date(task.dueDate) < new Date();
    }).length;

    return { total, completed, pending, overdue };
  },
};

function formatNotePreview(content, maxLength = 150) {
  if (!content) return "";
  let text = content.replace(/<[^>]*>/g, "");
  const entities = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#039;": "'",
  };

  Object.keys(entities).forEach((entity) => {
    text = text.replace(new RegExp(entity, "g"), entities[entity]);
  });

  text = text.replace(/\s+/g, " ").trim();
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim() + "...";
  }

  return text;
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing app...");
  initializeApp();
});

async function initializeApp() {
  console.log("Initializing app...");

  try {
    initTheme();
    if (document.getElementById("editor")) {
      quill = new Quill("#editor", {
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            ["blockquote", "code-block"],
            [{ header: 1 }, { header: 2 }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ script: "sub" }, { script: "super" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ direction: "rtl" }],
            [{ size: ["small", false, "large", "huge"] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ["clean"],
            ["link", "image"],
          ],
        },
        placeholder: "Write your note here...",
      });
      console.log("Quill editor initialized");
    } else {
      console.error("Editor element not found");
    }

    todoManager.load();

    setupEventListeners();
    await checkAuthState();
    console.log("App initialized successfully");
  } catch (error) {
    console.error("Error initializing app:", error);
    showError("Failed to initialize app: " + error.message);
  }
}

function setupEventListeners() {
  console.log("Setting up event listeners...");

  // Sidebar
  if (toggleSidebar)
    toggleSidebar.addEventListener("click", toggleSidebarCollapse);

  // Theme Toggle
  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);

  // Navigation
  document.querySelectorAll(".category-item").forEach((item) => {
    item.addEventListener("click", () => {
      const category = item.dataset.category;
      console.log("Category clicked:", category);
      if (category === "trash") {
        showTrashPage();
      } else if (category === "todo") {
        showTodoPage();
      } else {
        filterByCategory(category);
      }
    });
  });

  document.querySelectorAll(".tag-item").forEach((item) => {
    item.addEventListener("click", () => filterByTag(item.dataset.tag));
  });

  // Notes
  if (newNoteBtn) newNoteBtn.addEventListener("click", openNewNoteEditor);
  if (createFirstNoteBtn)
    createFirstNoteBtn.addEventListener("click", openNewNoteEditor);
  if (searchInput) searchInput.addEventListener("input", handleSearch);
  if (exportBtn) exportBtn.addEventListener("click", showExportModal);

  // Editor
  if (saveNoteBtn) saveNoteBtn.addEventListener("click", saveNote);
  if (cancelNoteBtn) cancelNoteBtn.addEventListener("click", closeEditor);
  if (closeEditorBtn) closeEditorBtn.addEventListener("click", closeEditor);

  // TODO Feature Event Listeners (Fixed)
  if (saveTodoBtn) saveTodoBtn.addEventListener("click", saveTodo);
  if (cancelTodoBtn) cancelTodoBtn.addEventListener("click", closeTodoEditor);
  if (closeTodoBtn) closeTodoBtn.addEventListener("click", closeTodoEditor);
  if (addTaskBtn) addTaskBtn.addEventListener("click", addTodoTaskItem);
  if (saveTaskBtn) saveTaskBtn.addEventListener("click", saveTask);
  if (cancelTaskBtn) cancelTaskBtn.addEventListener("click", closeTaskModal);
  if (closeTaskBtn) closeTaskBtn.addEventListener("click", closeTaskModal);

  // Export Modal
  if (closeExportBtn)
    closeExportBtn.addEventListener("click", closeExportModal);
  if (cancelExportBtn)
    cancelExportBtn.addEventListener("click", closeExportModal);
  if (startExportBtn) startExportBtn.addEventListener("click", startExport);

  // Export Options
  exportOptions.forEach((option) => {
    option.addEventListener("click", () => {
      exportOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
    });
  });
  window.addEventListener("online", handleOnlineStatus);
  window.addEventListener("offline", handleOnlineStatus);

  console.log("Event listeners set up");
}

// Theme Functions
function initTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeButton();
  if (currentTheme === "dark") {
    updateQuillTheme();
  }
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("theme", currentTheme);
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateQuillTheme();

  // Update button
  updateThemeButton();

  // Show notification
  showSuccess(`Switched to ${currentTheme} mode!`);
}

function updateThemeButton() {
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector("i");
    const text = themeToggleBtn.querySelector("span");

    if (currentTheme === "dark") {
      icon.className = "fas fa-sun";
      if (text) text.textContent = "Light Mode";
    } else {
      icon.className = "fas fa-moon";
      if (text) text.textContent = "Dark Mode";
    }
  }
}

function updateQuillTheme() {
  if (!quill) return;

  const toolbar = document.querySelector(".ql-toolbar");
  const container = document.querySelector(".ql-container");

  if (toolbar && container) {
    if (currentTheme === "dark") {
      toolbar.style.backgroundColor = "#1e293b";
      toolbar.style.borderColor = "#334155";
      container.style.backgroundColor = "#1e293b";
      container.style.borderColor = "#334155";
    } else {
      toolbar.style.backgroundColor = "";
      toolbar.style.borderColor = "";
      container.style.backgroundColor = "";
      container.style.borderColor = "";
    }
  }
}

async function checkAuthState() {
  console.log("Checking auth state...");

  auth.onAuthStateChanged(async (user) => {
    console.log("Auth state changed, user:", user);

    if (user) {
      console.log("User is signed in:", user.email);
      currentUser = user;
      isOnline = true;
      await loadNotes();
      showApp();
    } else {
      console.log("No user signed in");
      const offlineMode = localStorage.getItem("offlineMode");
      if (offlineMode === "true") {
        console.log("Offline mode enabled");
        currentUser = {
          uid: "offline-user",
          displayName: "Guest User",
          email: "guest@local.com",
        };
        isOnline = false;
        await loadNotes();
        showApp();
      } else {
        console.log("Showing auth modal");
        showAuthModal();
      }
    }
  });
}

function showAuthModal() {
  console.log("Showing auth modal");
  if (appContainer) appContainer.style.display = "none";
}

function showApp() {
  console.log("Showing app");
  if (appContainer) appContainer.style.display = "flex";
  updateUserInfo();
}

function updateUserInfo() {
  if (currentUser && userName && userEmail && userAvatar) {
    if (currentUser.uid === "offline-user") {
      userName.textContent = "Guest User";
      userEmail.textContent = "Using Local Storage";
      userAvatar.innerHTML = '<i class="fas fa-laptop"></i>';
    } else {
      userName.textContent = currentUser.displayName || "User";
      userEmail.textContent = currentUser.email || "";
      userAvatar.textContent = currentUser.displayName
        ? currentUser.displayName.charAt(0).toUpperCase()
        : currentUser.email
        ? currentUser.email.charAt(0).toUpperCase()
        : "U";
    }
  }
}

async function loadNotes() {
  console.log("Loading notes...");
  if (loadingSpinner) loadingSpinner.style.display = "flex";
  if (notesGrid) notesGrid.innerHTML = "";

  try {
    if (isOnline && currentUser.uid !== "offline-user") {
      console.log("Loading notes from Firebase...");
      const snapshot = await db
        .collection("notes")
        .where("userId", "==", currentUser.uid)
        .orderBy("updatedAt", "desc")
        .get();

      notes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Loaded ${notes.length} notes from Firebase`);
      const trashSnapshot = await db
        .collection("trash")
        .where("userId", "==", currentUser.uid)
        .orderBy("deletedAt", "desc")
        .get();

      trashNotes = trashSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Loaded ${trashNotes.length} notes from trash`);
    } else {
      console.log("Loading notes from localStorage...");
      const savedNotes = localStorage.getItem(`nexusNotes_${currentUser.uid}`);
      notes = savedNotes ? JSON.parse(savedNotes) : [];

      const savedTrash = localStorage.getItem(`nexusTrash_${currentUser.uid}`);
      trashNotes = savedTrash ? JSON.parse(savedTrash) : [];

      console.log(
        `Loaded ${notes.length} notes and ${trashNotes.length} trash notes from localStorage`
      );
    }

    renderNotes();
    updateStats();
    updateTrashCount();
  } catch (error) {
    console.error("Failed to load notes:", error);
    showError("Failed to load notes: " + error.message);
    notes = [];
    trashNotes = [];
  } finally {
    if (loadingSpinner) loadingSpinner.style.display = "none";
  }
}

function renderNotes() {
  if (!notesGrid) return;
  notesGrid.innerHTML = "";

  // Filter notes
  let filteredNotes = notes.filter((note) => {
    // Category filter
    if (currentCategory !== "all" && note.category !== currentCategory) {
      return false;
    }

    // Tag filter
    if (currentTag && (!note.tags || !note.tags.includes(currentTag))) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      const tagMatch =
        note.tags && note.tags.some((tag) => tag.toLowerCase().includes(query));

      if (!titleMatch && !contentMatch && !tagMatch) {
        return false;
      }
    }

    return true;
  });

  // Sort pinned first
  filteredNotes.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  // Update empty state
  if (emptyState) {
    emptyState.style.display = filteredNotes.length === 0 ? "block" : "none";
  }

  // Create note cards
  filteredNotes.forEach((note) => {
    const noteCard = createNoteCard(note);
    notesGrid.appendChild(noteCard);
  });
}

function createNoteCard(note) {
  const card = document.createElement("div");
  card.className = `note-card ${
    note.pinned ? "pinned" : ""
  } animate__animated animate__fadeIn`;
  card.dataset.id = note.id;

  // Format date
  const date = new Date(note.updatedAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  // Create tags HTML
  let tagsHTML = "";
  if (note.tags && note.tags.length > 0) {
    note.tags.forEach((tag) => {
      tagsHTML += `<span class="note-tag">${tag}</span>`;
    });
  }
  const contentPreview = formatNotePreview(note.content, 150);

  card.innerHTML = `
    <div class="note-card-header">
      <div>
        <h3 class="note-title">${note.title}</h3>
        <span class="note-category">${note.category}</span>
      </div>
      <button class="note-action-btn pin" title="${
        note.pinned ? "Unpin" : "Pin"
      }">
        <i class="fas fa-thumbtack"></i>
      </button>
    </div>
    <div class="note-content">${contentPreview}</div>
    ${tagsHTML ? `<div class="note-tags">${tagsHTML}</div>` : ""}
    <div class="note-footer">
      <div class="note-date">${formattedDate}</div>
      <div class="note-actions">
        <button class="note-action-btn edit" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="note-action-btn delete" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;

  // Add event listeners
  card.addEventListener("click", (e) => {
    if (!e.target.closest(".note-actions")) {
      openEditNoteEditor(note.id);
    }
  });

  card.querySelector(".pin").addEventListener("click", (e) => {
    e.stopPropagation();
    togglePin(note.id);
  });

  card.querySelector(".edit").addEventListener("click", (e) => {
    e.stopPropagation();
    openEditNoteEditor(note.id);
  });

  card.querySelector(".delete").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteNote(note.id);
  });

  return card;
}

function togglePin(noteId) {
  const noteIndex = notes.findIndex((n) => n.id === noteId);
  if (noteIndex !== -1) {
    notes[noteIndex].pinned = !notes[noteIndex].pinned;
    notes[noteIndex].updatedAt = new Date().toISOString();
    saveNotesToStorage();
    renderNotes();
    updateStats();
    showSuccess(notes[noteIndex].pinned ? "Note pinned!" : "Note unpinned!");
  }
}

function openNewNoteEditor() {
  isEditing = false;
  currentNoteId = null;
  editorTitle.textContent = "New Note";

  // Reset form
  noteTitle.value = "";
  quill.setContents([]);
  noteCategory.value = "personal";
  noteTags.value = "";
  notePinned.checked = false;

  // Show editor
  editorModal.classList.add("active");
  noteTitle.focus();
}

function openEditNoteEditor(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;

  isEditing = true;
  currentNoteId = noteId;
  editorTitle.textContent = "Edit Note";
  noteTitle.value = note.title;
  quill.setContents(quill.clipboard.convert(note.content || ""));
  noteCategory.value = note.category || "personal";
  noteTags.value = note.tags ? note.tags.join(", ") : "";
  notePinned.checked = note.pinned || false;

  // Show editor
  editorModal.classList.add("active");
}

async function saveNote() {
  const title = noteTitle.value.trim();
  const content = quill.root.innerHTML;
  const category = noteCategory.value;
  const tags = noteTags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);
  const pinned = notePinned.checked;

  if (!title) {
    showError("Please enter a title");
    return;
  }

  const noteData = {
    title,
    content,
    category,
    tags,
    pinned,
    updatedAt: new Date().toISOString(),
    userId: currentUser.uid,
  };

  if (isEditing) {
    const noteIndex = notes.findIndex((n) => n.id === currentNoteId);
    if (noteIndex !== -1) {
      notes[noteIndex] = {
        ...notes[noteIndex],
        ...noteData,
      };
    }
  } else {
    // Create new note
    const newNote = {
      id: generateId(),
      ...noteData,
      createdAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
  }

  await saveNotesToStorage();
  renderNotes();
  updateStats();
  closeEditor();

  showSuccess(isEditing ? "Note updated!" : "Note created!");
}

function closeEditor() {
  editorModal.classList.remove("active");
}

function filterByCategory(category) {
  currentCategory = category;
  currentTag = null;

  if (taskPanel) taskPanel.style.display = "none";

  if (notesGrid) notesGrid.style.display = "grid";
  if (emptyState) emptyState.style.display = "block";
  const trashContainer = document.getElementById("trashContainer");
  if (trashContainer) trashContainer.style.display = "none";
  document.querySelectorAll(".category-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.category === category);
  });

  document.querySelectorAll(".tag-item").forEach((item) => {
    item.classList.remove("active");
  });

  renderNotes();
}

function filterByTag(tag) {
  currentTag = currentTag === tag ? null : tag;
  document.querySelectorAll(".tag-item").forEach((item) => {
    item.classList.toggle(
      "active",
      item.dataset.tag === tag && currentTag === tag
    );
  });

  renderNotes();
}

function handleSearch() {
  searchQuery = searchInput.value;
  renderNotes();
}

function updateStats() {
  const total = notes.length;
  const pinned = notes.filter((note) => note.pinned).length;

  if (totalNotesEl) totalNotesEl.textContent = total;
  if (pinnedNotesEl) pinnedNotesEl.textContent = pinned;
}

// EXPORT FUNCTIONS
function showExportModal() {
  // Select PDF by default
  exportOptions.forEach((opt) => opt.classList.remove("active"));
  exportOptions[0].classList.add("active");

  // Set default filename
  const date = new Date().toISOString().split("T")[0];
  exportFileNameInput.value = `nexus-notes-${date}`;

  exportModal.classList.add("active");
}

function closeExportModal() {
  exportModal.classList.remove("active");
}

function getSelectedFormat() {
  const activeOption = document.querySelector(".export-option.active");
  return activeOption ? activeOption.dataset.format : "pdf";
}

async function startExport() {
  const format = getSelectedFormat();
  const exportAll = exportAllCheckbox.checked;
  const includeMetadata = includeMetadataCheckbox.checked;
  const fileName = exportFileNameInput.value.trim() || "nexus-notes-export";

  // Get notes to export
  let notesToExport = exportAll ? notes : getFilteredNotes();

  if (notesToExport.length === 0) {
    showError("No notes to export!");
    return;
  }

  closeExportModal();
  showExportLoading();

  try {
    switch (format) {
      case "pdf":
        await exportAsPDF(notesToExport, fileName, includeMetadata);
        break;
      case "txt":
        await exportAsTXT(notesToExport, fileName, includeMetadata);
        break;
      case "docx":
        await exportAsDOCX(notesToExport, fileName, includeMetadata);
        break;
      case "json":
        await exportAsJSON(notesToExport, fileName);
        break;
      default:
        showError("Invalid export format");
    }

    showSuccess(`Notes exported successfully as ${format.toUpperCase()}!`);
  } catch (error) {
    console.error("Export error:", error);
    showError("Export failed: " + error.message);
  } finally {
    hideExportLoading();
  }
}

function showExportLoading() {
  if (exportLoading) {
    exportLoading.classList.add("active");
  }
}

function hideExportLoading() {
  if (exportLoading) {
    exportLoading.classList.remove("active");
  }
}

function getFilteredNotes() {
  return notes.filter((note) => {
    if (currentCategory !== "all" && note.category !== currentCategory) {
      return false;
    }
    if (currentTag && (!note.tags || !note.tags.includes(currentTag))) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      const tagMatch =
        note.tags && note.tags.some((tag) => tag.toLowerCase().includes(query));

      if (!titleMatch && !contentMatch && !tagMatch) {
        return false;
      }
    }
    return true;
  });
}

// PDF Export using jsPDF
async function exportAsPDF(notesToExport, fileName, includeMetadata) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Add title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Notes Export", margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Exported on: ${new Date().toLocaleDateString()}`, margin, yPos);
  yPos += 10;
  doc.text(`Total Notes: ${notesToExport.length}`, margin, yPos);
  yPos += 15;

  // Add each note
  notesToExport.forEach((note, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Note title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${note.title}`, margin, yPos);
    yPos += 8;

    if (includeMetadata) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const metadata = [
        `Category: ${note.category}`,
        `Tags: ${note.tags ? note.tags.join(", ") : "None"}`,
        `Created: ${new Date(note.createdAt).toLocaleDateString()}`,
        `Updated: ${new Date(note.updatedAt).toLocaleDateString()}`,
      ];

      metadata.forEach((text) => {
        doc.text(text, margin, yPos);
        yPos += 5;
      });
      yPos += 3;
    }
    const cleanContent = formatNotePreview(note.content, 5000);
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(cleanContent, contentWidth);

    lines.forEach((line) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });

    yPos += 15;
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, 10);
  }

  // Save the PDF
  doc.save(`${fileName}.pdf`);
}

// TXT Export
async function exportAsTXT(notesToExport, fileName, includeMetadata) {
  let content = `Notes Export\n`;
  content += `Exported on: ${new Date().toLocaleDateString()}\n`;
  content += `Total Notes: ${notesToExport.length}\n\n`;
  content += "=".repeat(50) + "\n\n";

  notesToExport.forEach((note, index) => {
    content += `${index + 1}. ${note.title}\n`;
    content += "-".repeat(30) + "\n";

    if (includeMetadata) {
      content += `Category: ${note.category}\n`;
      content += `Tags: ${note.tags ? note.tags.join(", ") : "None"}\n`;
      content += `Created: ${new Date(note.createdAt).toLocaleDateString()}\n`;
      content += `Updated: ${new Date(note.updatedAt).toLocaleDateString()}\n`;
      content += "-".repeat(30) + "\n";
    }

    const cleanContent = formatNotePreview(note.content, 5000);
    content += cleanContent + "\n\n";
    content += "=".repeat(50) + "\n\n";
  });

  // Create and download text file
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// DOCX Export using docx library
async function exportAsDOCX(notesToExport, fileName, includeMetadata) {
  const docx = window.docx;
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
  } = docx;

  const sections = [];
  sections.push(
    new Paragraph({
      text: "Notes Export",
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Exported on: ${new Date().toLocaleDateString()}`,
          size: 20,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Total Notes: ${notesToExport.length}`,
          size: 20,
        }),
      ],
      spacing: { after: 300 },
    })
  );
  notesToExport.forEach((note, index) => {
    sections.push(
      new Paragraph({
        text: `${index + 1}. ${note.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    if (includeMetadata) {
      const metadataTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Category")] }),
              new TableCell({ children: [new Paragraph(note.category)] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Tags")] }),
              new TableCell({
                children: [
                  new Paragraph(note.tags ? note.tags.join(", ") : "None"),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Created")] }),
              new TableCell({
                children: [
                  new Paragraph(new Date(note.createdAt).toLocaleDateString()),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Updated")] }),
              new TableCell({
                children: [
                  new Paragraph(new Date(note.updatedAt).toLocaleDateString()),
                ],
              }),
            ],
          }),
        ],
      });

      sections.push(metadataTable);
    }
    const cleanContent = formatNotePreview(note.content, 5000);

    sections.push(
      new Paragraph({
        text: cleanContent,
        spacing: { before: 200, after: 400 },
      }),
      new Paragraph({
        text: "-".repeat(50),
        spacing: { after: 400 },
      })
    );
  });
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.docx`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// JSON Export
async function exportAsJSON(notesToExport, fileName) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalNotes: notesToExport.length,
    notes: notesToExport.map((note) => ({
      title: note.title,
      content: formatNotePreview(note.content, 5000),
      category: note.category,
      tags: note.tags,
      pinned: note.pinned,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    })),
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function handleOnlineStatus() {
  isOnline = navigator.onLine;
  showNotification(
    isOnline
      ? "You are back online!"
      : "You are offline. Changes will be saved locally."
  );
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showSuccess(message) {
  const isDark = currentTheme === "dark";

  Swal.fire({
    icon: "success",
    title: message,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    background: isDark ? "#1e293b" : "#ffffff",
    color: isDark ? "#f1f5f9" : "#1e293b",
  });
}

function showError(message) {
  const isDark = currentTheme === "dark";

  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
    confirmButtonColor: "#ef4444",
    background: isDark ? "#1e293b" : "#ffffff",
    color: isDark ? "#f1f5f9" : "#1e293b",
  });
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className =
    "notification animate__animated animate__fadeInRight";
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1rem 1.5rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 1000;
    max-width: 300px;
    color: var(--text-primary);
  `;
  notification.textContent = message;

  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add("animate__fadeOutRight");
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

function toggleSidebarCollapse() {
  sidebar.classList.toggle("collapsed");
  const icon = toggleSidebar.querySelector("i");
  icon.classList.toggle("fa-chevron-left");
  icon.classList.toggle("fa-chevron-right");
}

// TODO FEATURE FUNCTIONS (Fixed)
function showTodoPage() {
  console.log("Showing TODO page");

  if (notesGrid) notesGrid.style.display = "none";
  if (emptyState) emptyState.style.display = "none";

  if (taskPanel) {
    taskPanel.style.display = "block";
    loadTodoData();
  } else {
    console.error("Task panel not found");
    // Create task panel if it doesn't exist
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      const panel = document.createElement("div");
      panel.id = "taskPanel";
      panel.className = "task-panel";
      mainContent.appendChild(panel);
      setTimeout(() => loadTodoData(), 100);
    }
  }

  document.querySelectorAll(".category-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.category === "todo");
  });
}

function loadTodoData() {
  const userTodos = todoManager.getTodosByUserId(currentUser.uid);
  console.log(
    `Loading TODO data for user ${currentUser.uid}: ${userTodos.length} todos`
  );

  const stats = todoManager.getTaskStats();

  if (totalTasksEl) totalTasksEl.textContent = stats.total;
  if (completedTasksEl) completedTasksEl.textContent = stats.completed;
  if (pendingTasksEl) pendingTasksEl.textContent = stats.pending;
  if (overdueTasksEl) overdueTasksEl.textContent = stats.overdue;

  const container =
    todoListContainer || document.getElementById("todoListContainer");
  if (container) {
    if (userTodos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-tasks"></i>
          </div>
          <h3>No To-Do Lists</h3>
          <p class="text-secondary">Create your first to-do list to get started</p>
          <button class="btn btn-primary mt-3" id="createFirstTodoBtn">
            <i class="fas fa-plus-circle"></i> Create To-Do List
          </button>
        </div>
      `;

      // Add event listener to the create button
      setTimeout(() => {
        const createBtn = document.getElementById("createFirstTodoBtn");
        if (createBtn) {
          createBtn.addEventListener("click", openNewTodoEditor);
        }
      }, 100);
    } else {
      container.innerHTML = "";
      userTodos.forEach((todo) => {
        const todoElement = createTodoElement(todo);
        container.appendChild(todoElement);
      });
    }
  } else {
    console.error("Todo list container not found");
  }

  updateTodoStats();
}

function createTodoElement(todo) {
  const element = document.createElement("div");
  element.className = "todo-element";
  element.dataset.id = todo.id;

  const tasks = todoManager.getTasksByTodoId(todo.id);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  element.innerHTML = `
    <div class="todo-header">
      <h4 class="todo-title">${todo.title}</h4>
      <div class="todo-actions">
        <button class="btn btn-sm btn-outline-primary edit-todo" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-todo" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="todo-description">${todo.description || ""}</div>
    <div class="todo-progress">
      <div class="progress">
        <div class="progress-bar" style="width: ${progress}%"></div>
      </div>
      <div class="todo-stats">
        <span>${completedTasks} / ${totalTasks} tasks completed</span>
        <button class="btn btn-sm btn-outline-secondary add-task" title="Add Task">
          <i class="fas fa-plus"></i> Add Task
        </button>
      </div>
    </div>
    <div class="todo-tasks">
      ${tasks
        .slice(0, 3)
        .map(
          (task) => `
        <div class="todo-task ${task.completed ? "completed" : ""}">
          <input type="checkbox" ${
            task.completed ? "checked" : ""
          } class="task-checkbox" data-task-id="${task.id}">
          <span class="task-text">${task.title}</span>
          ${
            task.dueDate
              ? `<span class="task-due">${formatDate(task.dueDate)}</span>`
              : ""
          }
        </div>
      `
        )
        .join("")}
      ${
        tasks.length > 3
          ? `<div class="more-tasks">+${tasks.length - 3} more tasks</div>`
          : ""
      }
    </div>
  `;

  // Add event listeners
  element.querySelector(".edit-todo").addEventListener("click", (e) => {
    e.stopPropagation();
    openEditTodoEditor(todo.id);
  });

  element.querySelector(".delete-todo").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteTodo(todo.id);
  });

  element.querySelector(".add-task").addEventListener("click", (e) => {
    e.stopPropagation();
    openNewTaskModal(todo.id);
  });

  element.querySelectorAll(".task-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      e.stopPropagation();
      toggleTaskCompletion(e.target.dataset.taskId, e.target.checked);
    });
  });

  return element;
}

function openNewTodoEditor() {
  console.log("Opening new todo editor");

  if (todoEditorModal) {
    todoEditorTitle.textContent = "New To-Do List";

    // Clear form
    if (todoTitle) todoTitle.value = "";
    if (todoDescription) todoDescription.value = "";
    if (todoCategory) todoCategory.value = "todo";
    if (todoTags) todoTags.value = "";
    if (todoPinned) todoPinned.checked = false;
    if (todoListEditor) todoListEditor.innerHTML = "";

    // Add one empty task item
    addTodoTaskItem();

    todoEditorModal.classList.add("active");
    if (todoTitle) todoTitle.focus();
  } else {
    console.error("Todo editor modal not found");
  }
}

function openEditTodoEditor(todoId) {
  console.log("Opening edit todo editor for:", todoId);
  const todo = todoManager.todos.find((t) => t.id === todoId);
  if (!todo) return;

  if (todoEditorModal) {
    todoEditorTitle.textContent = "Edit To-Do List";

    // Fill form with todo data
    if (todoTitle) todoTitle.value = todo.title;
    if (todoDescription) todoDescription.value = todo.description || "";
    if (todoCategory) todoCategory.value = todo.category || "todo";
    if (todoTags) todoTags.value = todo.tags ? todo.tags.join(", ") : "";
    if (todoPinned) todoPinned.checked = todo.pinned || false;
    if (todoListEditor) todoListEditor.innerHTML = "";

    // Add tasks
    const tasks = todoManager.getTasksByTodoId(todoId);
    tasks.forEach((task) => {
      addTodoTaskItem(task);
    });

    todoEditorModal.dataset.currentTodoId = todoId;
    todoEditorModal.classList.add("active");
  }
}

function addTodoTaskItem(taskData = null) {
  if (!todoListEditor) return;

  const taskId = taskData?.id || generateId();
  const taskItem = document.createElement("li");
  taskItem.className = "todo-task-item";
  taskItem.innerHTML = `
    <div class="task-content">
      <input type="checkbox" ${
        taskData?.completed ? "checked" : ""
      } class="task-checkbox" data-task-id="${taskId}">
      <input type="text" class="form-control task-title" placeholder="Task title" value="${
        taskData?.title || ""
      }">
      <select class="form-control task-priority" style="width: auto;">
        <option value="low" ${
          taskData?.priority === "low" ? "selected" : ""
        }>Low</option>
        <option value="medium" ${
          !taskData?.priority || taskData?.priority === "medium"
            ? "selected"
            : ""
        }>Medium</option>
        <option value="high" ${
          taskData?.priority === "high" ? "selected" : ""
        }>High</option>
      </select>
      <input type="date" class="form-control task-due-date" value="${
        taskData?.dueDate || ""
      }">
    </div>
    <button type="button" class="btn btn-sm btn-danger remove-task">
      <i class="fas fa-trash"></i>
    </button>
  `;

  todoListEditor.appendChild(taskItem);

  taskItem.querySelector(".remove-task").addEventListener("click", () => {
    taskItem.remove();
  });
}

function saveTodo() {
  console.log("Saving todo...");

  if (!todoTitle) {
    console.error("Todo title element not found");
    return;
  }

  const title = todoTitle.value.trim();
  const description = todoDescription ? todoDescription.value.trim() : "";
  const category = todoCategory ? todoCategory.value : "todo";
  const tags = todoTags
    ? todoTags.value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    : [];
  const pinned = todoPinned ? todoPinned.checked : false;

  if (!title) {
    showError("Please enter a title for your to-do list");
    return;
  }

  // Collect tasks from the editor
  const tasks = [];
  document.querySelectorAll(".todo-task-item").forEach((item) => {
    const taskTitle = item.querySelector(".task-title").value.trim();
    if (taskTitle) {
      tasks.push({
        id: item.querySelector(".task-checkbox").dataset.taskId,
        title: taskTitle,
        priority: item.querySelector(".task-priority").value,
        dueDate: item.querySelector(".task-due-date").value,
        completed: item.querySelector(".task-checkbox").checked,
      });
    }
  });

  const todoId = todoEditorModal ? todoEditorModal.dataset.currentTodoId : null;

  if (todoId) {
    // Update existing todo
    const todo = todoManager.updateTodo(todoId, {
      title,
      description,
      category,
      tags,
      pinned,
    });

    if (todo) {
      // Delete old tasks and add new ones
      const oldTasks = todoManager.getTasksByTodoId(todoId);
      oldTasks.forEach((task) => {
        todoManager.deleteTask(task.id);
      });

      tasks.forEach((task) => {
        todoManager.addTask(todoId, {
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          completed: task.completed,
        });
      });

      showSuccess("To-Do list updated!");
    }
  } else {
    // Create new todo
    const todo = todoManager.addTodo({
      title,
      description,
      category,
      tags,
      pinned,
    });

    // Add tasks
    tasks.forEach((task) => {
      todoManager.addTask(todo.id, {
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        completed: task.completed,
      });
    });

    showSuccess("To-Do list created!");
  }

  closeTodoEditor();
  loadTodoData();
}

function closeTodoEditor() {
  if (todoEditorModal) {
    todoEditorModal.classList.remove("active");
    delete todoEditorModal.dataset.currentTodoId;
  }
}

function openNewTaskModal(todoId = null) {
  console.log("Opening new task modal for todo:", todoId);

  if (taskModal) {
    taskModalTitle.textContent = todoId ? "Add Task" : "New Task";

    if (todoId) {
      taskModal.dataset.todoId = todoId;
    }

    // Clear form
    if (taskTitle) taskTitle.value = "";
    if (taskPriority) taskPriority.value = "medium";
    if (taskDueDate) taskDueDate.value = "";

    taskModal.classList.add("active");
    if (taskTitle) taskTitle.focus();
  }
}

function saveTask() {
  console.log("Saving task...");

  if (!taskTitle) {
    console.error("Task title element not found");
    return;
  }

  const title = taskTitle.value.trim();
  const priority = taskPriority ? taskPriority.value : "medium";
  const dueDate = taskDueDate ? taskDueDate.value : null;
  const todoId = taskModal ? taskModal.dataset.todoId : null;

  if (!title) {
    showError("Please enter a task title");
    return;
  }

  if (todoId) {
    const task = todoManager.addTask(todoId, {
      title,
      priority,
      dueDate,
      completed: false,
    });

    if (task) {
      showSuccess("Task added!");
      closeTaskModal();
      loadTodoData();
    }
  } else {
    showError("No todo list selected");
  }
}

function closeTaskModal() {
  if (taskModal) {
    taskModal.classList.remove("active");
    delete taskModal.dataset.todoId;
  }
}

function toggleTaskCompletion(taskId, completed) {
  console.log(`Toggling task ${taskId} completion to: ${completed}`);
  todoManager.updateTask(taskId, { completed });
  loadTodoData();
}

function deleteTodo(todoId) {
  Swal.fire({
    title: "Delete To-Do List?",
    text: "This will delete the to-do list and all its tasks.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    background: currentTheme === "dark" ? "#1e293b" : "#ffffff",
    color: currentTheme === "dark" ? "#f1f5f9" : "#1e293b",
  }).then((result) => {
    if (result.isConfirmed) {
      todoManager.deleteTodo(todoId);
      showSuccess("To-Do list deleted!");
      loadTodoData();
    }
  });
}

function updateTodoStats() {
  const stats = todoManager.getTaskStats();

  // Update sidebar count
  const todoCountEl = document.getElementById("todoCount");
  if (todoCountEl) {
    todoCountEl.textContent = stats.total;
  }

  // Update badge
  const todoBadge = document.getElementById("todoBadge");
  if (todoBadge) {
    if (stats.pending > 0) {
      todoBadge.textContent = stats.pending;
      todoBadge.style.display = "inline-block";
    } else {
      todoBadge.style.display = "none";
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function updateTrashCount() {
  const trashItem = document.querySelector('[data-category="trash"]');
  if (trashItem) {
    const existingCount = trashItem.querySelector(".trash-count");
    if (existingCount) {
      existingCount.remove();
    }

    if (trashNotes.length > 0) {
      const countBadge = document.createElement("span");
      countBadge.className = "trash-count";
      countBadge.textContent = trashNotes.length;
      trashItem.querySelector(".category-text").after(countBadge);
    }
  }
}

async function deleteNote(noteId) {
  Swal.fire({
    title: "Move to Trash?",
    text: "This note will be moved to trash. You can restore it later.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Move to Trash",
    cancelButtonText: "Cancel",
    background: currentTheme === "dark" ? "#1e293b" : "#ffffff",
    color: currentTheme === "dark" ? "#f1f5f9" : "#1e293b",
  }).then(async (result) => {
    if (result.isConfirmed) {
      await moveToTrash(noteId);
    }
  });
}

async function moveToTrash(noteId) {
  console.log("Moving note to trash:", noteId);
  const noteIndex = notes.findIndex((n) => n.id === noteId);
  if (noteIndex !== -1) {
    const noteToTrash = {
      ...notes[noteIndex],
      deletedAt: new Date().toISOString(),
    };

    trashNotes.push(noteToTrash);

    notes = notes.filter((note) => note.id !== noteId);

    await saveNotesToStorage();
    await saveTrashToStorage();

    renderNotes();
    updateStats();
    updateTrashCount();

    showSuccess("Note moved to trash!");
  }
}

async function saveTrashToStorage() {
  if (isOnline && currentUser.uid !== "offline-user") {
    const batch = db.batch();
    trashNotes.forEach((note) => {
      const noteRef = db.collection("trash").doc(note.id);
      batch.set(noteRef, note);
    });
    await batch.commit();
  } else {
    localStorage.setItem(
      `nexusTrash_${currentUser.uid}`,
      JSON.stringify(trashNotes)
    );
  }
}

async function saveNotesToStorage() {
  console.log("Saving notes to storage...");

  if (isOnline && currentUser.uid !== "offline-user") {
    const notesBatch = db.batch();
    notes.forEach((note) => {
      const noteRef = db.collection("notes").doc(note.id);
      notesBatch.set(noteRef, note);
    });
    await notesBatch.commit();
    console.log("Notes saved to Firebase");
  } else {
    localStorage.setItem(
      `nexusNotes_${currentUser.uid}`,
      JSON.stringify(notes)
    );
    console.log("Notes saved to localStorage");
  }
}

function showTrashPage() {
  console.log("Showing trash page");

  if (notesGrid) notesGrid.style.display = "none";
  if (emptyState) emptyState.style.display = "none";

  const mainContent = document.querySelector(".main-content");
  if (!mainContent) return;
  let trashContainer = document.getElementById("trashContainer");
  if (!trashContainer) {
    trashContainer = document.createElement("div");
    trashContainer.id = "trashContainer";
    trashContainer.className = "trash-container";
    mainContent.appendChild(trashContainer);
  }

  trashContainer.style.display = "block";
  trashContainer.innerHTML = "";

  if (trashNotes.length === 0) {
    trashContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-trash"></i>
        </div>
        <h3>Trash is Empty</h3>
        <p class="text-secondary">Deleted notes will appear here</p>
        <button class="btn btn-primary mt-3" id="backToNotesBtn">
          <i class="fas fa-arrow-left"></i> Back to Notes
        </button>
      </div>
    `;

    // Add event listener to back button
    setTimeout(() => {
      const backBtn = document.getElementById("backToNotesBtn");
      if (backBtn) {
        backBtn.addEventListener("click", goBackToNotes);
      }
    }, 100);

    return;
  }
  trashContainer.innerHTML = `
    <div class="trash-header">
      <h2>Trash (${trashNotes.length})</h2>
      <div>
        <button class="btn btn-secondary mr-2" id="backBtn">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <button class="btn btn-danger" id="emptyTrashBtn">
          <i class="fas fa-trash"></i> Empty Trash
        </button>
      </div>
    </div>
    <div class="trash-notes" id="trashNotesGrid"></div>
  `;

  const trashNotesContainer = document.getElementById("trashNotesGrid");
  trashNotes.forEach((note) => {
    const noteElement = createTrashNoteCard(note);
    trashNotesContainer.appendChild(noteElement);
  });

  setTimeout(() => {
    const backBtn = document.getElementById("backBtn");
    if (backBtn) backBtn.addEventListener("click", goBackToNotes);

    const emptyBtn = document.getElementById("emptyTrashBtn");
    if (emptyBtn) emptyBtn.addEventListener("click", emptyTrash);
  }, 100);

  document.querySelectorAll(".category-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.category === "trash");
  });
}

function createTrashNoteCard(note) {
  const card = document.createElement("div");
  card.className = "note-card trash-note";
  card.dataset.id = note.id;

  const deletedDate = new Date(note.deletedAt);
  const formattedDate = deletedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let tagsHTML = "";
  if (note.tags && note.tags.length > 0) {
    note.tags.forEach((tag) => {
      tagsHTML += `<span class="note-tag">${tag}</span>`;
    });
  }
  const contentPreview = formatNotePreview(note.content, 150);

  card.innerHTML = `
    <div class="note-card-header">
      <div>
        <h3 class="note-title">${note.title}</h3>
        <span class="note-category">${note.category}</span>
      </div>
    </div>
    <div class="note-content">${contentPreview}</div>
    ${tagsHTML ? `<div class="note-tags">${tagsHTML}</div>` : ""}
    <div class="note-footer">
      <div class="note-date">Deleted: ${formattedDate}</div>
      <div class="note-actions">
        <button class="note-action-btn restore" title="Restore">
          <i class="fas fa-undo"></i>
        </button>
        <button class="note-action-btn delete-permanent" title="Delete Permanently">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;

  card.querySelector(".restore").addEventListener("click", (e) => {
    e.stopPropagation();
    restoreFromTrash(note.id);
  });

  card.querySelector(".delete-permanent").addEventListener("click", (e) => {
    e.stopPropagation();
    permanentDelete(note.id);
  });

  return card;
}

async function restoreFromTrash(noteId) {
  console.log("Restoring note from trash:", noteId);
  const noteIndex = trashNotes.findIndex((n) => n.id === noteId);
  if (noteIndex !== -1) {
    const noteToRestore = { ...trashNotes[noteIndex] };

    delete noteToRestore.deletedAt;

    notes.unshift(noteToRestore);

    trashNotes = trashNotes.filter((note) => note.id !== noteId);

    await saveNotesToStorage();
    await saveTrashToStorage();

    showTrashPage();
    updateTrashCount();

    showSuccess("Note restored!");
  }
}

async function permanentDelete(noteId) {
  Swal.fire({
    title: "Delete Permanently?",
    text: "This note will be permanently deleted. This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Delete Permanently",
    cancelButtonText: "Cancel",
    background: currentTheme === "dark" ? "#1e293b" : "#ffffff",
    color: currentTheme === "dark" ? "#f1f5f9" : "#1e293b",
  }).then(async (result) => {
    if (result.isConfirmed) {
      console.log("Permanently deleting note:", noteId);

      trashNotes = trashNotes.filter((note) => note.id !== noteId);

      if (isOnline && currentUser.uid !== "offline-user") {
        await db.collection("trash").doc(noteId).delete();
      }

      await saveTrashToStorage();

      showTrashPage();
      updateTrashCount();

      showSuccess("Note permanently deleted!");
    }
  });
}

async function emptyTrash() {
  Swal.fire({
    title: "Empty Trash?",
    text: "This will permanently delete all notes in trash. This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Empty Trash",
    cancelButtonText: "Cancel",
    background: currentTheme === "dark" ? "#1e293b" : "#ffffff",
    color: currentTheme === "dark" ? "#f1f5f9" : "#1e293b",
  }).then(async (result) => {
    if (result.isConfirmed) {
      console.log("Emptying trash...");

      if (isOnline && currentUser.uid !== "offline-user") {
        const batch = db.batch();
        trashNotes.forEach((note) => {
          const noteRef = db.collection("trash").doc(note.id);
          batch.delete(noteRef);
        });
        await batch.commit();
      }

      trashNotes = [];
      localStorage.removeItem(`nexusTrash_${currentUser.uid}`);

      showTrashPage();
      updateTrashCount();

      showSuccess("Trash emptied!");
    }
  });
}

function goBackToNotes() {
  console.log("Going back to notes");
  const trashContainer = document.getElementById("trashContainer");
  if (trashContainer) {
    trashContainer.style.display = "none";
  }

  if (notesGrid) notesGrid.style.display = "grid";

  filterByCategory("all");
}
