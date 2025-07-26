# 📝 To-Do List App

A clean, simple, and persistent To-Do List application built with **vanilla JavaScript**, **HTML**, and **Tailwind CSS**, leveraging **Firebase Firestore** for real-time data synchronization. This application allows users to effectively manage their daily tasks.

### 🔗 Live Demo:

[https://echotasks.netlify.app/](https://echotasks.netlify.app/)

---

## ✨ Features

* **Add Tasks**: Easily add new tasks using the input field.
* **Mark as Complete**: Toggle the completion status by clicking on a task. Completed tasks are struck through.
* **Delete Tasks**: Remove tasks with a dedicated delete button.
* **Persistent Storage**: Tasks are saved and loaded from Firebase Firestore, persisting across sessions and devices.
* **Real-time Updates**: All task changes are reflected instantly across all active sessions.
* **Responsive Design**: Optimized UI for desktops, tablets, and mobile phones.
* **Unique User Identification**: Automatically assigns a unique User ID to each session for personalized data storage.

---

## 🚀 Technologies Used

| Tool/Technology             | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| **HTML5**                   | Web page structure                                            |
| **Tailwind CSS**            | Utility-first styling for responsive and modern UI            |
| **Vanilla JavaScript**      | Logic, DOM manipulation, event handling, Firebase integration |
| **Firebase Firestore**      | Real-time NoSQL database for storing tasks                    |
| **Firebase Authentication** | Anonymous sign-in for managing user-specific task data        |

---

## ⚙️ Setup and Installation

> This application is contained within a single HTML file.

### 1. Save the File

* Copy the full code (starting from `<!DOCTYPE html>` to `</html>`).
* Paste into a plain text editor (e.g., VS Code, Notepad).
* Save the file with a `.html` extension (e.g., `todo_list.html`).

### 2. Open in Browser

* Navigate to the saved file location.
* Double-click to open in your default web browser.

### 🔐 Firebase Configuration Notes

This app expects Firebase config variables to be available globally as:

```js
__app_id, __firebase_config, __initial_auth_token
```

If not defined, the app will default to anonymous sign-in using a fallback config. For production use, replace these with your actual Firebase project credentials.

---

## 💡 Usage

* **Add Task**: Type in the input box and press Enter or click **Add**.
* **Toggle Completion**: Click on the task text to mark as complete/incomplete.
* **Delete Task**: Click the trash icon beside a task.
* **User ID**: Displayed at the top; used to manage user-specific Firestore data.

---

## 📊 Firestore Data Structure

Firestore stores data in the path:

```
artifacts/{appId}/users/{userId}/tasks
```

Each task document includes:

* `text` *(string)*: Task description
* `completed` *(boolean)*: Completion status
* `timestamp` *(timestamp)*: Created date/time (used for sorting)

---

## 🛠️ Future Enhancements

* **Editing Tasks**: Inline task editing capability.
* **Filtering/Sorting**: Show only completed/active tasks, or sort alphabetically or by date.
* **Due Dates**: Add due date input and reminders.
* **Tags/Categories**: Organize tasks using labels.
* **Email/Google Sign-In**: Expand authentication beyond anonymous sign-in.
* **Drag-and-Drop Reordering**: Let users manually sort tasks.
* **Public/Shared Lists**: Enable users to share task lists with others.

---

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

You are free to:

* Share — copy and redistribute the material in any medium or format
* Adapt — remix, transform, and build upon the material

Under the following terms:

* **Attribution** — You must give appropriate credit.
* **NonCommercial** — You may not use the material for commercial purposes.

To view a copy of this license, visit: [https://creativecommons.org/licenses/by-nc/4.0/](https://creativecommons.org/licenses/by-nc/4.0/)

Commercial use is strictly prohibited.
