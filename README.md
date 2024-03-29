
Task Terminator

Overview

Task Terminator is a task management system designed to streamline the process of managing tasks. This application allows users to create an account, add tasks, set deadlines, mark tasks as complete, and much more.

Development Environment

For the best experience in developing and maintaining Task Terminator, we recommend using a powerful Integrated Development Environment (IDE) that supports JavaScript and Node.js development. These environments provide useful features such as code completion, debugging tools, and extensions to enhance productivity.
We recommend using Visual Studio as IDE for developing and maintaining Task Terminator. 

Installation

Prerequisites
Visual Studio or another IDE that supports JavaScript and Node.js development
Node.js and npm installed
MySQL server running

Getting Started

1. Clone the repository:

       git clone https://github.com/Sepidehri/task-terminator.git

2. Navigate to the project directory:

       cd task-terminator

3. Install dependencies:

       npm install


MySQL Database Setup

        Install MySQL Server

Refer to the official MySQL (https://dev.mysql.com/doc/refman/8.0/en/installing.htm) for installation instructions on your operating system.

Configure MySQL

- Start MySQL server:
  - Windows: The server should start automatically after installation.
  - Linux: `sudo systemctl start mysql`

- Secure MySQL (recommended):
  
            sudo mysql_secure_installation
  

Create a Database

- Access the MySQL shell:
  
            mysql -u root -p
  
  Enter your root password when prompted.

- Create the database:

            CREATE DATABASE starpath;
  

Create Tables

- Select the database:

            USE starpath;
  
- Create a `tasks` table:

       CREATE TABLE tasks ( id INT AUTO_INCREMENT PRIMARY KEY, 
       name VARCHAR(100) NOT NULL, description VARCHAR(100), 
       deadline DATE, 
       reminderDateTime DATETIME, 
       completed TINYINT NOT NULL DEFAULT 0, 
       category VARCHAR(100), 
       username VARCHAR(100) NOT NULL, 
       priority VARCHAR(100), 
       sharedWith VARCHAR(100), 
       createdAt DATETIME NOT NULL, 
       updatedAt DATETIME NOT NULL, 
       inCalendar TINYINT NOT NULL DEFAULT 0 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
       subtasks VARCHAR(100) NOT NULL, 
  
- Create a `users` table:

       CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(45) NOT NULL, 
       password VARCHAR(500) NOT NULL, 
       email VARCHAR(45) NOT NULL, 
       createdAt DATETIME NOT NULL, 
       updatedAt DATETIME NOT NULL ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

- Create a `subtasks` table:

         CREATE TABLE subtasks ( id INT NOT NULL AUTO_INCREMENT,
         title VARCHAR(100) NOT NULL,
         description VARCHAR(100),
         taskId INT NOT NULL,
         createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
         updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         PRIMARY KEY (id),
         FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  

Alternative: MySQL Workbench
For those who prefer a graphical interface, MySQL Workbench is an excellent alternative. It provides a user-friendly environment for database design, administration, and management.
Download MySQL Workbench from the official website(https://dev.mysql.com/downloads/workbench/).
Install and open MySQL Workbench.
Connect to the MySQL server instance.
Create a new schema (starpath) by right-clicking on the 'Schemas' area and selecting 'Create Schema'.
Use the built-in tools to design and create your tables (tasks, users, etc.).

![PHOTO-2024-01-21-22-37-56](https://github.com/Sepidehri/task-terminator/assets/114486248/72ea2441-014c-4084-a99f-653cc047bb5e)
![PHOTO-2024-01-21-22-38-48](https://github.com/Sepidehri/task-terminator/assets/114486248/b7caa98e-b4ae-4f80-aa96-bbe3ffd5966b)
![PHOTO-2024-01-22-02-27-24](https://github.com/Sepidehri/task-terminator/assets/114486248/ea41f5c4-fa8d-476a-80b3-ff04662ef441)




Manage User Permissions

- Create a new user:

      CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password';
  
- Grant privileges:

      GRANT ALL PRIVILEGES ON starpath.* TO 'app_user'@'localhost';
      FLUSH PRIVILEGES;

  Replace `app_user` and `password` with your chosen username and password.

Or use the dummy account:

       E-mail: ttermdummy@gmail.com
       Password: campus09

Start the Application
- Set up the `.env` file with the MySQL user and database information.

- Start the server:

      node server.js

To be able to access the application using a browser:

       npm start
  

Usage

After installation, you can use Task Terminator as follows:
Account Creation:
Navigate to http://localhost:3000 and sign up for an account.
Creating Tasks:
Once logged in, use the 'Create Task' button to add new tasks.
Setting Deadlines and Reminders:
Specify deadlines and set reminders while creating or editing tasks.
Task Management:
Tasks can be marked as complete, edited, or deleted as per your needs.
Categorization and Prioritization:
Organize tasks into categories and set priorities for better management.

Project Demo:
![cd292d7b-bf44-4273-9be1-dc248e016c71](https://github.com/Sepidehri/task-terminator/assets/114486248/d9f63086-3299-4ee8-9ad2-4e0cfd4f5b57)
![9749d26f-0a86-48de-990d-33b10a7e61b2](https://github.com/Sepidehri/task-terminator/assets/114486248/e6563535-dca9-4047-8a83-2e4dec90d772)


MoSCoW Criteria

Must-Have
M1: Account creation for system access.
M2: Ability to create tasks.
M3: Setting deadlines for tasks.
M4: Marking tasks as complete.
M5: Deleting tasks.

Should-Have
S1: Categorizing tasks (work, personal, etc.).
S2: Setting reminders for tasks.
S3: Modifying tasks after creation.
S4: Prioritizing tasks and adding sub-tasks or notes.

Could-Have
C1: Syncing tasks with external calendars (Google Calendar, Outlook).
C2: Sharing tasks for collaborative work.

Won't-Have
Complex project management features like Gantt charts or resource allocation.



