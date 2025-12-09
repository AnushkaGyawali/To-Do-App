# 📝 EchoTasks: Advanced To-Do List App

EchoTasks is a clean, secure, and persistent Advanced To-Do List Application built with **vanilla JavaScript**, **HTML**, and **Vanilla CSS**, enhanced by **Firebase Firestore** for real-time synchronization. Designed to be lightweight yet powerful, it enables users to efficiently manage tasks across devices.

### 🔗 Live Demo

[https://echotasks.netlify.app/](https://echotasks.netlify.app/ "null")

## ✨ Features (Current and In-Progress)

### ✅ Current Features

* **Add Tasks**: Easily add new tasks using the input field.
* **Mark as Complete**: Click a task to toggle its completion (completed tasks are crossed out).
* **Delete Tasks**: Remove tasks with a dedicated delete button.
* **Persistent Storage**: Tasks are saved and loaded from Firebase Firestore.
* **Real-Time Updates**: All changes reflect instantly across active sessions.
* **Responsive Design**: Optimized UI for desktops, tablets, and mobile devices.
* **Unique User Identification**: Automatically assigns a unique User ID to each session.

### 🔧 In-Progress Features

* **Security & Account Management (Scaffolded)**: Basic functions for password change, account deletion, etc.
* **Task Editing**: Inline task text editing.
* **Data Export**: Ability to export tasks to a downloadable file (JSON/CSV).

## 🚀 Technologies Used

| **Tool / Technology**       | **Purpose**                                                   |
| --------------------------- | ------------------------------------------------------------- |
| **HTML5**                   | Web page structure                                            |
| **Vanilla CSS**             | Styling for a modern, responsive UI                           |
| **Vanilla JavaScript**      | Logic, DOM manipulation, event handling, Firebase integration |
| **Firebase Firestore**      | Real-time NoSQL database for storing tasks                    |
| **Firebase Authentication** | Anonymous sign-in and account management                      |

## ⚙️ Setup and Installation

> This application is contained within a single HTML file.

### 1. Save the File

* Copy the full code (from `<!DOCTYPE html>` to `</html>`)
* Paste it into a plain text editor (VS Code, Notepad, etc.)
* Save it with a `.html` extension (e.g., `todo_list.html`)

### 2. Open in Browser

* Navigate to the saved file location
* Double-click to open in your browser

### 🔐 Firebase Configuration Notes

The app expects these global Firebase variables:

```
__app_id, __firebase_config, __initial_auth_token


```

If they are not defined, the app defaults to anonymous sign-in using fallback config.

For production, replace these with your actual Firebase credentials.

## 💡 Usage

* **Add Task**: Type in the input box and press Enter or click **Add**.
* **Toggle Completion**: Click the task text.
* **Delete Task**: Click the trash icon.
* **User ID**: Displayed at the top; used to manage data per user.

## 📊 Firestore Data Structure

Tasks are stored under:

```
artifacts/{appId}/users/{userId}/tasks


```

Each task document contains:

* `text` *(string)* — Task description
* `completed` *(boolean)* — Completion status
* `timestamp` *(timestamp)* — Created date/time

## 🛠️ Future Enhancements (Roadmap)

* **Complete Account Management**: Full implementation of password change, secure deletion, and profile info updates.
* **Data Export**: Fully implementing the ability to fetch all user tasks and export them to a file (JSON/CSV).
* **Task Management Polish**:

  * **Filtering & Sorting**: Robust controls to filter by active/completed status and sort by time, name, etc.
  * **Input Validation & Toast Notifications**: Comprehensive input validation and toast messages for all user actions.
* **Advanced Task Options**:

  * **Due dates**
  * **Priority levels**
  * **Categories / Tags**
* **Recurring Tasks**: Implementing logic for tasks that repeat daily, weekly, or monthly.
* **Expanded Authentication**: Integrate email/password or Google sign-in options.
* **Drag-and-Drop Reordering**
* **Public / Shared Lists**

## 📄 License

Licensed under **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

You are free to:

* **Share** — copy and redistribute the material
* **Adapt** — remix, transform, and build upon it

Under the terms:

* **Attribution** — Proper credit required
* **NonCommercial** — No commercial use allowed

View full license: [https://creativecommons.org/licenses/by-nc/4.0/](https://creativecommons.org/licenses/by-nc/4.0/ "null")

🚫 **Commercial use is strictly prohibited.**
