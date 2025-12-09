import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    deleteUser
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
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7ZesRhCUfElvv58AyzSQjXcP_dqbFH_4",
    authDomain: "my-to-do-app-cd314.firebaseapp.com",
    projectId: "my-to-do-app-cd314",
    storageBucket: "my-to-do-app-cd314.firebasestorage.app",
    messagingSenderId: "184421960045",
    appId: "1:184421960045:web:57b0e84b5b38ebaf27b264",
    measurementId: "G-S0VBJXLSDX"
};

const appId = firebaseConfig.projectId;
let app;
let db;
let auth;
let currentUser = null;
let userId = null;
let isAuthReady = false;
let unsubscribeFromTasks = null;
let currentFilter = 'all';
let currentSort = 'timestamp_asc';

const authContainer = document.getElementById('authContainer');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

const todoContainer = document.getElementById('todoContainer');
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDateInput');
const dueTimeInput = document.getElementById('dueTimeInput');
const categoryInput = document.getElementById('categoryInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const userIdDisplay = document.getElementById('userIdDisplay');
const emailVerificationMessage = document.getElementById('emailVerificationMessage');
const resendVerificationBtn = document.getElementById('resendVerificationBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const filterSelect = document.getElementById('filterSelect');
const sortSelect = document.getElementById('sortSelect');

const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
// Theme Elements
const themeSelect = document.getElementById('themeSelect');
const darkModeToggleBtn = document.getElementById('darkModeToggleBtn');
const displayModeText = document.getElementById('displayModeText');

const passwordChangeBtn = document.getElementById('passwordChangeBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const addProfileInfoBtn = document.getElementById('addProfileInfoBtn');
const exportDataBtn = document.getElementById('exportDataBtn');
const openFiderBtn = document.getElementById('openFiderBtn');
const logoutBtn = document.getElementById('logoutBtn');

const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

let draggedItem = null;

// --- New Theme & Display Mode Logic ---

/**
 * @function setTheme
 * @description Updates the data-theme attribute on the HTML element and saves preference.
 * @param {string} themeName - The value of the theme (e.g., "theme1")
 */
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('selectedTheme', themeName);
    // Sync the dropdown value just in case
    if(themeSelect) themeSelect.value = themeName;
}

/**
 * @function setDisplayMode
 * @description Updates the data-display attribute (light/dark) and saves preference.
 * @param {string} mode - "light" or "dark"
 */
function setDisplayMode(mode) {
    document.documentElement.setAttribute('data-display', mode);
    localStorage.setItem('displayMode', mode);
    
    // Update button text to reflect current state or next action
    if (displayModeText) {
        displayModeText.textContent = mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode";
    }
}

/**
 * @function toggleDisplayMode
 * @description Toggles between light and dark display modes.
 */
function toggleDisplayMode() {
    const currentMode = document.documentElement.getAttribute('data-display') || 'light';
    const newMode = currentMode === 'dark' ? 'light' : 'dark';
    setDisplayMode(newMode);
    // Keep menu open or close it? Let's keep it open for user convenience
}

/**
 * @function applySavedPreferences
 * @description Loads saved theme and display mode from localStorage on startup.
 */
function applySavedPreferences() {
    // 1. Load Theme (Default to theme1)
    const savedTheme = localStorage.getItem('selectedTheme') || 'theme1';
    setTheme(savedTheme);

    // 2. Load Display Mode (Default to light)
    const savedMode = localStorage.getItem('displayMode') || 'light';
    setDisplayMode(savedMode);
}

// --- End New Logic ---


function showMessageBox(message) {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
}

messageBoxCloseBtn.addEventListener('click', () => {
    messageBox.classList.add('hidden');
});

function toggleSettingsMenu() {
    settingsMenu.classList.toggle('hidden');
}


function handlePasswordChange() {
    showMessageBox("To change your password, please use the 'Forgot Password?' link on the login page. This ensures a secure process.");
    settingsMenu.classList.add('hidden');
}

async function handleDeleteAccount() {
    if (!currentUser) {
        showMessageBox("You must be logged in to delete your account.");
        settingsMenu.classList.add('hidden');
        return;
    }
    showMessageBox("For security, you need to re-authenticate to delete your account. Please log out and log back in, then try deleting your account again.");
    settingsMenu.classList.add('hidden');
}

function handleAddProfileInfo() {
    showMessageBox("This feature is under development. You will be able to add profile information here soon!");
    settingsMenu.classList.add('hidden');
}

async function handleExportData() {
    if (!db || !userId || !isAuthReady) {
        showMessageBox("Please log in to export your data.");
        settingsMenu.classList.add('hidden');
        return;
    }
    showMessageBox("Exporting data to PDF is under development. This feature will be available soon!");
    settingsMenu.classList.add('hidden');
}

async function initializeFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) {
                userId = user.uid;
                userIdDisplay.textContent = `User ID: ${userId}`;
                isAuthReady = true;

                if (!user.emailVerified) {
                    emailVerificationMessage.classList.remove('hidden');
                } else {
                    emailVerificationMessage.classList.add('hidden');
                }

                authContainer.classList.add('hidden');
                todoContainer.classList.remove('hidden');
                console.log("User signed in:", userId);
                setupRealtimeListener();
            } else {
                userId = null;
                isAuthReady = false;
                authContainer.classList.remove('hidden');
                todoContainer.classList.add('hidden');
                taskList.innerHTML = '';
                userIdDisplay.textContent = 'Please log in.';
                emailVerificationMessage.classList.add('hidden');
                console.log("User signed out.");
                if (unsubscribeFromTasks) {
                    unsubscribeFromTasks();
                    unsubscribeFromTasks = null;
                }
            }
        });
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showMessageBox("Failed to initialize the application. Check console for details.");
    }
}

function setupRealtimeListener() {
    if (!db || !userId || !isAuthReady) {
        console.log("Firestore not ready or user not authenticated. Skipping listener setup.");
        return;
    }

    loadingIndicator.classList.remove('hidden');
    const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
    const q = query(tasksCollectionRef);

    if (unsubscribeFromTasks) {
        unsubscribeFromTasks();
    }

    unsubscribeFromTasks = onSnapshot(q, (snapshot) => {
        let tasks = [];
        snapshot.forEach(doc => {
            const taskData = doc.data();
            tasks.push({ id: doc.id, ...taskData });
        });

        tasks = filterTasks(tasks, currentFilter);
        tasks = sortTasks(tasks, currentSort);

        taskList.innerHTML = '';
        tasks.forEach(task => displayTask(task));
        loadingIndicator.classList.add('hidden');
    }, (error) => {
        console.error("Error fetching real-time tasks:", error);
        showMessageBox("Error loading tasks. Please refresh.");
        loadingIndicator.classList.add('hidden');
    });
}

function filterTasks(tasks, filter) {
    switch (filter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'all':
        default:
            return tasks;
    }
}

function sortTasks(tasks, sortOrder) {
    return tasks.sort((a, b) => {
        const createDateTime = (dateStr, timeStr) => {
            if (!dateStr) return null;
            const fullDateTimeStr = `${dateStr}T${timeStr || '00:00'}:00`;
            return new Date(fullDateTimeStr);
        };

        switch (sortOrder) {
            case 'timestamp_asc':
                return (a.timestamp ? a.timestamp.toDate() : 0) - (b.timestamp ? b.timestamp.toDate() : 0);
            case 'timestamp_desc':
                return (b.timestamp ? b.timestamp.toDate() : 0) - (a.timestamp ? a.timestamp.toDate() : 0);
            case 'dueDate_asc':
                const dateA = createDateTime(a.dueDate, a.dueTime) || new Date('9999-12-31T23:59:59');
                const dateB = createDateTime(b.dueDate, b.dueTime) || new Date('9999-12-31T23:59:59');
                return dateA.getTime() - dateB.getTime();
            case 'dueDate_desc':
                const dateADesc = createDateTime(a.dueDate, a.dueTime) || new Date('0000-01-01T00:00:00');
                const dateBDesc = createDateTime(b.dueDate, b.dueTime) || new Date('0000-01-01T00:00:00');
                return dateBDesc.getTime() - dateADesc.getTime();
            case 'text_asc':
                return a.text.localeCompare(b.text);
            case 'text_desc':
                return b.text.localeCompare(a.text);
            default:
                return 0;
        }
    });
}

function displayTask(task) {
    const listItem = document.createElement('li');
    listItem.dataset.id = task.id;
    listItem.draggable = true;
    listItem.classList.add('task-item');

    listItem.addEventListener('dragstart', (e) => {
        draggedItem = listItem;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => listItem.classList.add('dragging'), 0);
    });

    listItem.addEventListener('dragover', (e) => {
        e.preventDefault();
        const boundingBox = listItem.getBoundingClientRect();
        const offset = boundingBox.y + (boundingBox.height / 2);

        // Get the computed primary color for the border to match theme
        // We can't use 'var(--primary)' directly in JS logic easily without fetching it
        // But we can set the style using the variable string!
        const accentColor = 'var(--primary)';

        if (e.clientY < offset) {
            listItem.style.borderTop = '2px solid ' + accentColor;
            listItem.style.borderBottom = 'none';
        } else {
            listItem.style.borderBottom = '2px solid ' + accentColor;
            listItem.style.borderTop = 'none';
        }
    });

    listItem.addEventListener('dragleave', () => {
        listItem.style.borderTop = 'none';
        listItem.style.borderBottom = 'none';
    });

    listItem.addEventListener('drop', (e) => {
        e.preventDefault();
        listItem.style.borderTop = 'none';
        listItem.style.borderBottom = 'none';

        if (draggedItem && draggedItem !== listItem) {
            const boundingBox = listItem.getBoundingClientRect();
            const offset = boundingBox.y + (boundingBox.height / 2);

            if (e.clientY < offset) {
                taskList.insertBefore(draggedItem, listItem);
            } else {
                taskList.insertBefore(draggedItem, listItem.nextSibling);
            }
            updateTaskOrder();
        }
    });

    listItem.addEventListener('dragend', () => {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
        Array.from(taskList.children).forEach(item => {
            item.style.borderTop = 'none';
            item.style.borderBottom = 'none';
        });
    });

    const mainContentDiv = document.createElement('div');
    mainContentDiv.classList.add('task-content');

    const taskTextSpan = document.createElement('span');
    taskTextSpan.textContent = task.text;
    taskTextSpan.classList.add('task-text');
    taskTextSpan.contentEditable = true;
    taskTextSpan.spellcheck = false;

    if (task.completed) {
        taskTextSpan.classList.add('completed');
    }

    taskTextSpan.addEventListener('blur', () => updateTaskText(task.id, taskTextSpan.textContent.trim()));
    taskTextSpan.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            taskTextSpan.blur();
        }
    });
    taskTextSpan.addEventListener('click', () => toggleTaskCompletion(task.id, !task.completed));

    const metaInfoDiv = document.createElement('div');
    metaInfoDiv.classList.add('task-meta');

    if (task.dueDate) {
        const dueDateSpan = document.createElement('span');
        const fullDueDate = new Date(`${task.dueDate}T${task.dueTime || '00:00'}:00`);
        const today = new Date();
        today.setHours(0,0,0,0);

        let dateClass = '';
        if (fullDueDate.toDateString() === today.toDateString() && !task.completed) {
            dateClass = 'text-due-today';
        } else if (fullDueDate < today && !task.completed) {
            dateClass = 'text-danger';
        }
        if (dateClass) dueDateSpan.classList.add(dateClass);

        dueDateSpan.textContent = `Due: ${fullDueDate.toLocaleDateString()} ${task.dueTime ? fullDueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`;
        metaInfoDiv.appendChild(dueDateSpan);
    }

    if (task.category && task.category.trim() !== '') {
        const categorySpan = document.createElement('span');
        categorySpan.classList.add('category-tag');
        categorySpan.textContent = task.category;
        metaInfoDiv.appendChild(categorySpan);
    }

    mainContentDiv.appendChild(taskTextSpan);
    mainContentDiv.appendChild(metaInfoDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('task-actions');

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    `;
    deleteBtn.classList.add('btn-delete');
    deleteBtn.title = "Delete Task";
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actionsDiv.appendChild(deleteBtn);
    listItem.appendChild(mainContentDiv);
    listItem.appendChild(actionsDiv);
    taskList.appendChild(listItem);
}

async function updateTaskOrder() {
    if (!db || !userId || !isAuthReady) {
        showMessageBox("Please log in to reorder tasks.");
        return;
    }

    const listItems = Array.from(taskList.children);
    const batch = db.batch();

    for (let i = 0; i < listItems.length; i++) {
        const taskId = listItems[i].dataset.id;
        const taskRef = doc(db, `artifacts/${appId}/users/${userId}/tasks`, taskId);
        batch.update(taskRef, { order: i });
    }

    try {
        await batch.commit();
        console.log("Task order updated successfully.");
    } catch (error) {
        console.error("Error updating task order:", error);
        showMessageBox("Failed to reorder tasks. Please try again.");
    }
}

async function addTaskToFirestore(text, dueDate = null, dueTime = null, category = null) {
    if (!db || !userId || !isAuthReady) {
        showMessageBox("Please log in to add tasks.");
        return;
    }
    if (text.trim() === '') {
        showMessageBox("Task cannot be empty!");
        return;
    }
    try {
        const currentTasksSnapshot = await getDocs(collection(db, `artifacts/${appId}/users/${userId}/tasks`));
        const newOrder = currentTasksSnapshot.size;

        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), {
            text: text,
            completed: false,
            timestamp: new Date(),
            dueDate: dueDate,
            dueTime: dueTime,
            category: category,
            order: newOrder
        });
        taskInput.value = '';
        dueDateInput.value = '';
        dueTimeInput.value = '';
        categoryInput.value = '';
    } catch (e) {
        console.error("Error adding document: ", e);
        showMessageBox("Failed to add task. Please try again.");
    }
}

async function updateTaskText(id, newText) {
    if (!db || !userId || !isAuthReady) {
        showMessageBox("Please log in to edit tasks.");
        return;
    }
    if (newText.trim() === '') {
        showMessageBox("Task text cannot be empty! Reverting to previous text.");
        setupRealtimeListener();
        return;
    }
    try {
        const taskRef = doc(db, `artifacts/${appId}/users/${userId}/tasks`, id);
        await updateDoc(taskRef, {
            text: newText
        });
    } catch (e) {
        console.error("Error updating task text: ", e);
        showMessageBox("Failed to update task text. Please try again.");
    }
}

async function toggleTaskCompletion(id, completed) {
    if (!db || !userId || !isAuthReady) {
        showMessageBox("Please log in to update tasks.");
        return;
    }
    try {
        const taskRef = doc(db, `artifacts/${appId}/users/${userId}/tasks`, id);
        await updateDoc(taskRef, {
            completed: completed
        });
    } catch (e) {
        console.error("Error updating document: ", e);
        showMessageBox("Failed to update task status. Please try again.");
    }
}

async function deleteTask(id) {
    if (!db || !userId || !isAuthReady) {
        showMessageBox("Please log in to delete tasks.");
        return;
    }
    try {
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, id));
    } catch (e) {
        console.error("Error deleting document: ", e);
        showMessageBox("Failed to delete task. Please try again.");
    }
}

async function handleSignUp() {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        showMessageBox("Please enter both email and password.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        showMessageBox("Account created! A verification email has been sent to your address. Please verify your email to ensure full functionality.");
    } catch (error) {
        console.error("Error signing up:", error);
        let errorMessage = "Failed to create account.";
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "This email is already in use. Try logging in.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email address.";
                break;
            case 'auth/weak-password':
                errorMessage = "Password should be at least 6 characters.";
                break;
            default:
                errorMessage = `Error: ${error.message}`;
        }
        showMessageBox(errorMessage);
    }
}

async function handleLogin() {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        showMessageBox("Please enter both email and password.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessageBox("Logged in successfully!");
    } catch (error) {
        console.error("Error logging in:", error);
        let errorMessage = "Invalid email or password.";
        switch (error.code) {
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email address format.";
                break;
            default:
                errorMessage = `Error: ${error.message}`;
        }
        showMessageBox(errorMessage);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        showMessageBox("Logged out successfully!");
    } catch (error) {
        console.error("Error logging out:", error);
        showMessageBox("Failed to log out. Please try again.");
    }
}

async function handleForgotPassword() {
    const email = emailInput.value;
    if (!email) {
        showMessageBox("Please enter your email address to reset your password.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        showMessageBox(`Password reset email sent to ${email}. Please check your inbox.`);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        let errorMessage = "Failed to send password reset email.";
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = "Invalid email address.";
                break;
            case 'auth/user-not-found':
                errorMessage = "No user found with that email address.";
                break;
            default:
                errorMessage = `Error: ${error.message}`;
        }
        showMessageBox(errorMessage);
    }
}

async function handleResendVerificationEmail() {
    if (currentUser && !currentUser.emailVerified) {
        try {
            await sendEmailVerification(currentUser);
            showMessageBox("Verification email re-sent! Please check your inbox.");
        }
        catch (error) {
            console.error("Error resending verification email:", error);
            showMessageBox("Failed to resend verification email. Please try again.");
        }
    } else {
        showMessageBox("No unverified user logged in, or email already verified.");
    }
}

addTaskBtn.addEventListener('click', () => addTaskToFirestore(taskInput.value, dueDateInput.value, dueTimeInput.value, categoryInput.value.trim()));

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTaskToFirestore(taskInput.value, dueDateInput.value, dueTimeInput.value, categoryInput.value.trim());
    }
});

loginBtn.addEventListener('click', handleLogin);
signupBtn.addEventListener('click', handleSignUp);
forgotPasswordBtn.addEventListener('click', handleForgotPassword);
resendVerificationBtn.addEventListener('click', handleResendVerificationEmail);

filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    setupRealtimeListener();
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    setupRealtimeListener();
});

emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

settingsBtn.addEventListener('click', toggleSettingsMenu);

// Update listeners for new controls
themeSelect.addEventListener('change', (e) => setTheme(e.target.value));
darkModeToggleBtn.addEventListener('click', toggleDisplayMode); // Changed from toggleDarkMode

passwordChangeBtn.addEventListener('click', handlePasswordChange);
deleteAccountBtn.addEventListener('click', handleDeleteAccount);
addProfileInfoBtn.addEventListener('click', handleAddProfileInfo);
exportDataBtn.addEventListener('click', handleExportData);
openFiderBtn.addEventListener('click', () => {
    window.open('https://echotasks.fider.io/', '_blank');
    settingsMenu.classList.add('hidden');
});
logoutBtn.addEventListener('click', handleLogout);

document.addEventListener('click', (event) => {
    if (!settingsMenu.contains(event.target) && !settingsBtn.contains(event.target) && !settingsMenu.classList.contains('hidden')) {
        settingsMenu.classList.add('hidden');
    }
});

// Use new init function
applySavedPreferences();

window.onload = initializeFirebase;