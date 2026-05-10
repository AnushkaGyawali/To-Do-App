/**
 * EchoTasks — script.js
 * Firebase v9 modular SDK + vanilla JS
 * Handles: auth, real-time task CRUD, drag-and-drop reorder,
 *          theme / display-mode persistence, settings menu.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  getDocs,
  writeBatch,   // ← v9 batch API (replaces the broken db.batch())
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* ------------------------------------------------------------------
   Firebase config
   ------------------------------------------------------------------ */
const firebaseConfig = {
  apiKey:            "AIzaSyB7ZesRhCUfElvv58AyzSQjXcP_dqbFH_4",
  authDomain:        "my-to-do-app-cd314.firebaseapp.com",
  projectId:         "my-to-do-app-cd314",
  storageBucket:     "my-to-do-app-cd314.firebasestorage.app",
  messagingSenderId: "184421960045",
  appId:             "1:184421960045:web:57b0e84b5b38ebaf27b264",
  measurementId:     "G-S0VBJXLSDX",
};

/* ------------------------------------------------------------------
   App state
   ------------------------------------------------------------------ */
const appId = firebaseConfig.projectId;

let app, db, auth;
let currentUser       = null;
let userId            = null;
let isAuthReady       = false;
let unsubscribeFromTasks = null;
let currentFilter     = "all";
let currentSort       = "timestamp_asc";
let draggedItem       = null;

/* ------------------------------------------------------------------
   DOM references
   ------------------------------------------------------------------ */

// Auth
const authContainer      = document.getElementById("authContainer");
const emailInput         = document.getElementById("emailInput");
const passwordInput      = document.getElementById("passwordInput");
const loginBtn           = document.getElementById("loginBtn");
const signupBtn          = document.getElementById("signupBtn");
const forgotPasswordBtn  = document.getElementById("forgotPasswordBtn");

// Todo
const todoContainer           = document.getElementById("todoContainer");
const taskInput               = document.getElementById("taskInput");
const dueDateInput            = document.getElementById("dueDateInput");
const dueTimeInput            = document.getElementById("dueTimeInput");
const categoryInput           = document.getElementById("categoryInput");
const addTaskBtn              = document.getElementById("addTaskBtn");
const taskList                = document.getElementById("taskList");
const userIdDisplay           = document.getElementById("userIdDisplay");
const emailVerificationMessage = document.getElementById("emailVerificationMessage");
const resendVerificationBtn   = document.getElementById("resendVerificationBtn");
const loadingIndicator        = document.getElementById("loadingIndicator");
const filterSelect            = document.getElementById("filterSelect");
const sortSelect              = document.getElementById("sortSelect");
const emptyState              = document.getElementById("emptyState");
const taskCountBadge          = document.getElementById("taskCountBadge");

// Settings
const settingsBtn         = document.getElementById("settingsBtn");
const settingsMenu        = document.getElementById("settingsMenu");
const themeSelect         = document.getElementById("themeSelect");
const darkModeToggleBtn   = document.getElementById("darkModeToggleBtn");
const displayModeText     = document.getElementById("displayModeText");
const passwordChangeBtn   = document.getElementById("passwordChangeBtn");
const deleteAccountBtn    = document.getElementById("deleteAccountBtn");
const addProfileInfoBtn   = document.getElementById("addProfileInfoBtn");
const exportDataBtn       = document.getElementById("exportDataBtn");
const openFiderBtn        = document.getElementById("openFiderBtn");
const logoutBtn           = document.getElementById("logoutBtn");

// Modal
const messageBox         = document.getElementById("messageBox");
const messageText        = document.getElementById("messageText");
const messageBoxCloseBtn = document.getElementById("messageBoxCloseBtn");

/* ==================================================================
   THEME & DISPLAY MODE
   ================================================================== */

/**
 * Apply a named theme to <html> and persist it.
 * @param {string} themeName - e.g. "theme2"
 */
function setTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  localStorage.setItem("selectedTheme", themeName);
  if (themeSelect) themeSelect.value = themeName;
}

/**
 * Apply light or dark display mode and persist it.
 * @param {"light"|"dark"} mode
 */
function setDisplayMode(mode) {
  document.documentElement.setAttribute("data-display", mode);
  localStorage.setItem("displayMode", mode);
  if (displayModeText) {
    displayModeText.textContent =
      mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
  }
}

/** Toggle between light and dark. */
function toggleDisplayMode() {
  const current = document.documentElement.getAttribute("data-display") || "light";
  setDisplayMode(current === "dark" ? "light" : "dark");
}

/** Load saved theme / mode preferences from localStorage on startup. */
function applySavedPreferences() {
  setTheme(localStorage.getItem("selectedTheme") || "theme1");
  setDisplayMode(localStorage.getItem("displayMode") || "light");
}

/* ==================================================================
   MODAL (message box)
   ================================================================== */

function showMessageBox(message) {
  messageText.textContent = message;
  messageBox.classList.remove("hidden");
  messageBoxCloseBtn.focus();
}

messageBoxCloseBtn.addEventListener("click", () => {
  messageBox.classList.add("hidden");
});

// Close modal on overlay click
messageBox.addEventListener("click", (e) => {
  if (e.target === messageBox) messageBox.classList.add("hidden");
});

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !messageBox.classList.contains("hidden")) {
    messageBox.classList.add("hidden");
  }
});

/* ==================================================================
   SETTINGS MENU
   ================================================================== */

function openSettingsMenu() {
  settingsMenu.classList.remove("hidden");
  settingsBtn.setAttribute("aria-expanded", "true");
}

function closeSettingsMenu() {
  settingsMenu.classList.add("hidden");
  settingsBtn.setAttribute("aria-expanded", "false");
}

function toggleSettingsMenu() {
  const isOpen = !settingsMenu.classList.contains("hidden");
  isOpen ? closeSettingsMenu() : openSettingsMenu();
}

settingsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleSettingsMenu();
});

// Close when clicking outside
document.addEventListener("click", (e) => {
  if (
    !settingsMenu.classList.contains("hidden") &&
    !settingsMenu.contains(e.target) &&
    !settingsBtn.contains(e.target)
  ) {
    closeSettingsMenu();
  }
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !settingsMenu.classList.contains("hidden")) {
    closeSettingsMenu();
    settingsBtn.focus();
  }
});

/* ------------------------------------------------------------------
   Settings action handlers
   ------------------------------------------------------------------ */

function handlePasswordChange() {
  showMessageBox(
    "To change your password, use the 'Forgot Password?' link on the login screen. This keeps the process secure."
  );
  closeSettingsMenu();
}

async function handleDeleteAccount() {
  if (!currentUser) {
    showMessageBox("You must be logged in to delete your account.");
    closeSettingsMenu();
    return;
  }
  showMessageBox(
    "For security, please log out and log back in, then try deleting your account again."
  );
  closeSettingsMenu();
}

function handleAddProfileInfo() {
  showMessageBox("Profile info management is under development — coming soon!");
  closeSettingsMenu();
}

async function handleExportData() {
  if (!db || !userId || !isAuthReady) {
    showMessageBox("Please log in to export your data.");
    closeSettingsMenu();
    return;
  }
  showMessageBox("PDF export is under development — coming soon!");
  closeSettingsMenu();
}

/* ==================================================================
   FIREBASE INITIALISATION & AUTH
   ================================================================== */

async function initializeFirebase() {
  try {
    app  = initializeApp(firebaseConfig);
    db   = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, (user) => {
      currentUser = user;

      if (user) {
        userId      = user.uid;
        isAuthReady = true;

        // Show user ID pill
        userIdDisplay.textContent = `UID: ${userId}`;
        userIdDisplay.classList.remove("hidden");

        // Email verification banner
        if (!user.emailVerified) {
          emailVerificationMessage.classList.remove("hidden");
        } else {
          emailVerificationMessage.classList.add("hidden");
        }

        authContainer.classList.add("hidden");
        todoContainer.classList.remove("hidden");
        console.log("User signed in:", userId);
        setupRealtimeListener();
      } else {
        userId      = null;
        isAuthReady = false;

        authContainer.classList.remove("hidden");
        todoContainer.classList.add("hidden");
        taskList.innerHTML = "";
        userIdDisplay.textContent = "";
        userIdDisplay.classList.add("hidden");
        emailVerificationMessage.classList.add("hidden");
        toggleEmptyState(false); // hide while logged out

        console.log("User signed out.");

        if (unsubscribeFromTasks) {
          unsubscribeFromTasks();
          unsubscribeFromTasks = null;
        }
      }
    });
  } catch (error) {
    console.error("Error initialising Firebase:", error);
    showMessageBox("Failed to initialise the application. Check the console for details.");
  }
}

/* ==================================================================
   REAL-TIME TASK LISTENER
   ================================================================== */

function setupRealtimeListener() {
  if (!db || !userId || !isAuthReady) {
    console.log("Firestore not ready or user not authenticated. Skipping listener.");
    return;
  }

  loadingIndicator.classList.remove("hidden");
  toggleEmptyState(false);

  const tasksRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
  const q        = query(tasksRef);

  if (unsubscribeFromTasks) unsubscribeFromTasks();

  unsubscribeFromTasks = onSnapshot(
    q,
    (snapshot) => {
      let tasks = [];
      snapshot.forEach((d) => tasks.push({ id: d.id, ...d.data() }));

      tasks = filterTasks(tasks, currentFilter);
      tasks = sortTasks(tasks, currentSort);

      taskList.innerHTML = "";
      tasks.forEach((task) => displayTask(task));

      loadingIndicator.classList.add("hidden");
      updateTaskCount(tasks.length);
      toggleEmptyState(tasks.length === 0);
    },
    (error) => {
      console.error("Error fetching real-time tasks:", error);
      showMessageBox("Error loading tasks. Please refresh the page.");
      loadingIndicator.classList.add("hidden");
    }
  );
}

/* ------------------------------------------------------------------
   Filter & Sort helpers
   ------------------------------------------------------------------ */

function filterTasks(tasks, filter) {
  switch (filter) {
    case "active":    return tasks.filter((t) => !t.completed);
    case "completed": return tasks.filter((t) =>  t.completed);
    default:          return tasks;
  }
}

function sortTasks(tasks, sortOrder) {
  const toDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    return new Date(`${dateStr}T${timeStr || "00:00"}:00`);
  };

  return [...tasks].sort((a, b) => {
    switch (sortOrder) {
      case "timestamp_asc":
        return (a.timestamp?.toDate() ?? 0) - (b.timestamp?.toDate() ?? 0);
      case "timestamp_desc":
        return (b.timestamp?.toDate() ?? 0) - (a.timestamp?.toDate() ?? 0);
      case "dueDate_asc": {
        const dA = toDateTime(a.dueDate, a.dueTime) ?? new Date("9999-12-31");
        const dB = toDateTime(b.dueDate, b.dueTime) ?? new Date("9999-12-31");
        return dA - dB;
      }
      case "dueDate_desc": {
        const dA = toDateTime(a.dueDate, a.dueTime) ?? new Date("0001-01-01");
        const dB = toDateTime(b.dueDate, b.dueTime) ?? new Date("0001-01-01");
        return dB - dA;
      }
      case "text_asc":  return a.text.localeCompare(b.text);
      case "text_desc": return b.text.localeCompare(a.text);
      default:          return 0;
    }
  });
}

/* ------------------------------------------------------------------
   UI helpers: task count badge & empty state
   ------------------------------------------------------------------ */

function updateTaskCount(count) {
  if (!taskCountBadge) return;
  taskCountBadge.textContent = String(count);
  taskCountBadge.classList.toggle("hidden", count === 0);
}

function toggleEmptyState(show) {
  if (!emptyState) return;
  emptyState.classList.toggle("hidden", !show);
}

/* ==================================================================
   DISPLAY A TASK ITEM
   ================================================================== */

function displayTask(task) {
  const li = document.createElement("li");
  li.dataset.id  = task.id;
  li.draggable   = true;
  li.classList.add("task-item");
  li.setAttribute("role", "listitem");

  /* ---------- Drag-and-drop ---------- */
  li.addEventListener("dragstart", (e) => {
    draggedItem = li;
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => li.classList.add("dragging"), 0);
  });

  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    const mid = li.getBoundingClientRect().y + li.getBoundingClientRect().height / 2;
    li.style.borderTop    = e.clientY < mid ? "2px solid var(--primary)" : "none";
    li.style.borderBottom = e.clientY < mid ? "none" : "2px solid var(--primary)";
  });

  li.addEventListener("dragleave", () => {
    li.style.borderTop = li.style.borderBottom = "none";
  });

  li.addEventListener("drop", (e) => {
    e.preventDefault();
    li.style.borderTop = li.style.borderBottom = "none";
    if (draggedItem && draggedItem !== li) {
      const mid = li.getBoundingClientRect().y + li.getBoundingClientRect().height / 2;
      taskList.insertBefore(draggedItem, e.clientY < mid ? li : li.nextSibling);
      updateTaskOrder();
    }
  });

  li.addEventListener("dragend", () => {
    draggedItem?.classList.remove("dragging");
    draggedItem = null;
    Array.from(taskList.children).forEach((item) => {
      item.style.borderTop = item.style.borderBottom = "none";
    });
  });

  /* ---------- Task text (editable) ---------- */
  const taskContentDiv = document.createElement("div");
  taskContentDiv.classList.add("task-content");

  const taskTextSpan = document.createElement("span");
  taskTextSpan.textContent    = task.text;
  taskTextSpan.classList.add("task-text");
  taskTextSpan.contentEditable = "true";
  taskTextSpan.spellcheck      = false;
  taskTextSpan.setAttribute("role", "textbox");
  taskTextSpan.setAttribute("aria-label", `Task: ${task.text}`);
  taskTextSpan.setAttribute(
    "aria-description",
    "Click to toggle completion. Edit text inline then press Enter or click away to save."
  );

  if (task.completed) taskTextSpan.classList.add("completed");

  taskTextSpan.addEventListener("blur", () =>
    updateTaskText(task.id, taskTextSpan.textContent.trim())
  );
  taskTextSpan.addEventListener("keypress", (e) => {
    if (e.key === "Enter") { e.preventDefault(); taskTextSpan.blur(); }
  });
  taskTextSpan.addEventListener("click", () =>
    toggleTaskCompletion(task.id, !task.completed)
  );

  /* ---------- Meta row (due date, category) ---------- */
  const metaDiv = document.createElement("div");
  metaDiv.classList.add("task-meta");

  if (task.dueDate) {
    const dueDateSpan  = document.createElement("span");
    dueDateSpan.classList.add("task-due-date");

    const fullDueDate = new Date(`${task.dueDate}T${task.dueTime || "00:00"}:00`);
    const today       = new Date(); today.setHours(0, 0, 0, 0);

    if (!task.completed) {
      if (fullDueDate.toDateString() === today.toDateString()) {
        dueDateSpan.classList.add("text-due-today");
      } else if (fullDueDate < today) {
        dueDateSpan.classList.add("text-danger");
      }
    }

    const timeStr = task.dueTime
      ? fullDueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
    dueDateSpan.textContent = `Due: ${fullDueDate.toLocaleDateString()}${timeStr ? " " + timeStr : ""}`;
    metaDiv.appendChild(dueDateSpan);
  }

  if (task.category?.trim()) {
    const categorySpan = document.createElement("span");
    categorySpan.classList.add("category-tag");
    categorySpan.textContent = task.category.trim();
    metaDiv.appendChild(categorySpan);
  }

  taskContentDiv.appendChild(taskTextSpan);
  taskContentDiv.appendChild(metaDiv);

  /* ---------- Actions (delete) ---------- */
  const actionsDiv  = document.createElement("div");
  actionsDiv.classList.add("task-actions");

  const deleteBtn = document.createElement("button");
  deleteBtn.type  = "button";
  deleteBtn.classList.add("btn-delete");
  deleteBtn.title             = "Delete task";
  deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6m4-6v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  `;
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  actionsDiv.appendChild(deleteBtn);
  li.appendChild(taskContentDiv);
  li.appendChild(actionsDiv);
  taskList.appendChild(li);
}

/* ==================================================================
   FIRESTORE TASK OPERATIONS
   ================================================================== */

async function addTaskToFirestore(text, dueDate = null, dueTime = null, category = null) {
  if (!db || !userId || !isAuthReady) {
    showMessageBox("Please log in to add tasks."); return;
  }
  if (!text.trim()) {
    showMessageBox("Task cannot be empty!"); return;
  }
  try {
    const snapshot = await getDocs(
      collection(db, `artifacts/${appId}/users/${userId}/tasks`)
    );
    await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), {
      text:      text.trim(),
      completed: false,
      timestamp: new Date(),
      dueDate:   dueDate   || null,
      dueTime:   dueTime   || null,
      category:  category  || null,
      order:     snapshot.size,
    });
    taskInput.value    = "";
    dueDateInput.value = "";
    dueTimeInput.value = "";
    categoryInput.value = "";
    taskInput.focus();
  } catch (e) {
    console.error("Error adding task:", e);
    showMessageBox("Failed to add task. Please try again.");
  }
}

async function updateTaskText(id, newText) {
  if (!db || !userId || !isAuthReady) {
    showMessageBox("Please log in to edit tasks."); return;
  }
  if (!newText.trim()) {
    showMessageBox("Task text cannot be empty! Reverting.");
    setupRealtimeListener(); return;
  }
  try {
    await updateDoc(
      doc(db, `artifacts/${appId}/users/${userId}/tasks`, id),
      { text: newText.trim() }
    );
  } catch (e) {
    console.error("Error updating task text:", e);
    showMessageBox("Failed to update task text. Please try again.");
  }
}

async function toggleTaskCompletion(id, completed) {
  if (!db || !userId || !isAuthReady) {
    showMessageBox("Please log in to update tasks."); return;
  }
  try {
    await updateDoc(
      doc(db, `artifacts/${appId}/users/${userId}/tasks`, id),
      { completed }
    );
  } catch (e) {
    console.error("Error toggling completion:", e);
    showMessageBox("Failed to update task status. Please try again.");
  }
}

async function deleteTask(id) {
  if (!db || !userId || !isAuthReady) {
    showMessageBox("Please log in to delete tasks."); return;
  }
  try {
    await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, id));
  } catch (e) {
    console.error("Error deleting task:", e);
    showMessageBox("Failed to delete task. Please try again.");
  }
}

/** Persist the current visual order of tasks to Firestore. */
async function updateTaskOrder() {
  if (!db || !userId || !isAuthReady) {
    showMessageBox("Please log in to reorder tasks."); return;
  }
  const items  = Array.from(taskList.children);
  const batch  = writeBatch(db); // ← v9 modular batch

  items.forEach((item, index) => {
    const taskRef = doc(db, `artifacts/${appId}/users/${userId}/tasks`, item.dataset.id);
    batch.update(taskRef, { order: index });
  });

  try {
    await batch.commit();
    console.log("Task order updated.");
  } catch (error) {
    console.error("Error updating task order:", error);
    showMessageBox("Failed to reorder tasks. Please try again.");
  }
}

/* ==================================================================
   AUTH OPERATIONS
   ================================================================== */

async function handleSignUp() {
  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessageBox("Please enter both email and password."); return;
  }
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    showMessageBox(
      "Account created! A verification email has been sent. Please verify your address."
    );
  } catch (error) {
    console.error("Sign-up error:", error);
    const messages = {
      "auth/email-already-in-use": "This email is already registered. Try logging in.",
      "auth/invalid-email":        "Invalid email address.",
      "auth/weak-password":        "Password must be at least 6 characters.",
    };
    showMessageBox(messages[error.code] ?? `Error: ${error.message}`);
  }
}

async function handleLogin() {
  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessageBox("Please enter both email and password."); return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Login error:", error);
    const messages = {
      "auth/invalid-credential": "Invalid email or password.",
      "auth/invalid-email":      "Invalid email address format.",
    };
    showMessageBox(messages[error.code] ?? `Error: ${error.message}`);
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    closeSettingsMenu();
  } catch (error) {
    console.error("Logout error:", error);
    showMessageBox("Failed to log out. Please try again.");
  }
}

async function handleForgotPassword() {
  const email = emailInput.value.trim();
  if (!email) {
    showMessageBox("Enter your email address above first."); return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessageBox(`Password reset email sent to ${email}. Check your inbox.`);
  } catch (error) {
    console.error("Password reset error:", error);
    const messages = {
      "auth/invalid-email":  "Invalid email address.",
      "auth/user-not-found": "No account found with that email.",
    };
    showMessageBox(messages[error.code] ?? `Error: ${error.message}`);
  }
}

async function handleResendVerificationEmail() {
  if (currentUser && !currentUser.emailVerified) {
    try {
      await sendEmailVerification(currentUser);
      showMessageBox("Verification email resent! Check your inbox.");
    } catch (error) {
      console.error("Resend verification error:", error);
      showMessageBox("Failed to resend verification email. Please try again.");
    }
  } else {
    showMessageBox("No unverified user is logged in, or email is already verified.");
  }
}

/* ==================================================================
   EVENT LISTENERS
   ================================================================== */

// Task input actions
addTaskBtn.addEventListener("click", () =>
  addTaskToFirestore(
    taskInput.value,
    dueDateInput.value,
    dueTimeInput.value,
    categoryInput.value.trim()
  )
);

taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTaskToFirestore(
      taskInput.value,
      dueDateInput.value,
      dueTimeInput.value,
      categoryInput.value.trim()
    );
  }
});

// Auth form keyboard navigation
emailInput.addEventListener("keypress",    (e) => { if (e.key === "Enter") passwordInput.focus(); });
passwordInput.addEventListener("keypress", (e) => { if (e.key === "Enter") handleLogin(); });

// Auth buttons
loginBtn.addEventListener("click",           handleLogin);
signupBtn.addEventListener("click",          handleSignUp);
forgotPasswordBtn.addEventListener("click",  handleForgotPassword);
resendVerificationBtn.addEventListener("click", handleResendVerificationEmail);

// Filter & sort
filterSelect.addEventListener("change", (e) => { currentFilter = e.target.value; setupRealtimeListener(); });
sortSelect.addEventListener("change",   (e) => { currentSort   = e.target.value; setupRealtimeListener(); });

// Settings actions
themeSelect.addEventListener("change",     (e) => setTheme(e.target.value));
darkModeToggleBtn.addEventListener("click",    toggleDisplayMode);
passwordChangeBtn.addEventListener("click",    handlePasswordChange);
addProfileInfoBtn.addEventListener("click",    handleAddProfileInfo);
exportDataBtn.addEventListener("click",        handleExportData);
deleteAccountBtn.addEventListener("click",     handleDeleteAccount);
logoutBtn.addEventListener("click",            handleLogout);

openFiderBtn.addEventListener("click", () => {
  window.open("https://echotasks.fider.io/", "_blank", "noopener,noreferrer");
  closeSettingsMenu();
});

/* ==================================================================
   STARTUP
   ================================================================== */
applySavedPreferences();
window.onload = initializeFirebase;