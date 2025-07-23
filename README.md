📝 To-Do List App
A clean, simple, and persistent To-Do List application built with vanilla JavaScript, HTML, and Tailwind CSS, leveraging Firebase Firestore for real-time data synchronization. This application allows users to effectively manage their daily tasks.

✨ Features
Add Tasks: Easily add new tasks to your list using the input field.

Mark as Complete: Toggle the completion status of tasks by clicking on their text. Completed tasks are visually struck through.

Delete Tasks: Remove tasks from your list with a dedicated delete button.

Persistent Storage: All your tasks are automatically saved and loaded from Firebase Firestore, ensuring your data is retained even if you close the browser or access the app from a different device.

Real-time Updates: Changes made to your tasks (adding, completing, deleting) are instantly reflected across all active sessions, thanks to Firestore's real-time listeners.

Responsive Design: The user interface is designed to be responsive, providing an optimal viewing and interaction experience on various devices (desktops, tablets, and mobile phones).

Unique User Identification: The application displays a unique user ID, which is automatically generated or provided by the environment, allowing for distinct user data storage.

🚀 Technologies Used
HTML5: For the basic structure and content of the web page.

Tailwind CSS: A utility-first CSS framework used for rapid and responsive UI development, providing a clean and modern look.

Vanilla JavaScript: Powers the application's logic, including DOM manipulation, event handling, and integration with Firebase.

Firebase Firestore: A NoSQL cloud database used for storing and synchronizing task data in real-time.

Firebase Authentication: Used for anonymous authentication to manage user-specific data without requiring sign-ups.

⚙️ Setup and Installation
This application is a single HTML file, making it very easy to set up and run.

Save the File:

Copy the entire code block provided (from <!DOCTYPE html> to </html>).

Paste it into a plain text editor (e.g., Notepad, VS Code, Sublime Text).

Save the file with an .html extension (e.g., todo_list.html). Make sure to select "All Files" or "Plain Text" as the file type if prompted, to ensure the .html extension is applied correctly.

Open in Browser:

Navigate to the saved todo_list.html file on your computer.

Double-click the file to open it in your default web browser.

Note on Firebase Configuration:
This application is designed to work within an environment that provides Firebase configuration variables (__app_id, __firebase_config, __initial_auth_token). When running locally, if these variables are not defined, the app will use default values and attempt anonymous sign-in. For a production environment or custom Firebase project, you would typically replace these global variables with your actual Firebase project's configuration details.

💡 Usage
Add a Task: Type your task into the input field and click the "Add" button, or press Enter.

Mark as Complete/Incomplete: Click on the text of any task to toggle its completion status.

Delete a Task: Click the trash can icon next to a task to permanently remove it from your list.

User ID: Your unique User ID is displayed at the top of the application. This ID is used to store your tasks separately in the database.

📊 Firestore Data Structure
Tasks are stored in Firestore under a collection path structured as:
artifacts/{appId}/users/{userId}/tasks

Each task document contains the following fields:

text (string): The description of the task.

completed (boolean): Indicates whether the task is completed (true) or not (false).

timestamp (timestamp): The time when the task was created, used for sorting tasks.

🛠️ Future Enhancements
Editing Tasks: Add functionality to edit existing task descriptions.

Filtering/Sorting: Implement options to filter tasks (e.g., show only active, only completed) or sort them by different criteria (e.g., alphabetically, by due date).

Due Dates: Add a field for due dates and reminders.

Categories/Tags: Allow users to categorize or tag tasks for better organization.

User Authentication (Email/Password, Google Sign-in): Implement more robust authentication methods instead of anonymous sign-in.

Drag-and-Drop Reordering: Allow users to reorder tasks by dragging and dropping them.

Public/Shared Lists: Extend the functionality to allow users to create and share public task lists.