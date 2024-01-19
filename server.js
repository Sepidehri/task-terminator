let tasks = [];
require('dotenv').config()
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const db = require("./models");
const User = db.user;
const Task = db.task;
const Reminder = db.reminder;
var session = require('express-session')
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))
app.use(express.static(path.join(__dirname, 'files')));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json())
// Routes for static pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});
// User account route - serves the account page and should be protected to ensure only logged-in users can access it
app.get('/dashboard', (req, res) => {
  if (!req.session.username) {
    // If there is no session, redirect to the login page or send an unauthorized response
    return res.redirect('/');
  }
  res.sendFile(__dirname + '/dashboard.html');
});
app.get('/account-detail', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const user = await User.findOne({
      where: {
        username: req.session.username,
      },
    });
    if (user) {
      return res.status(200).send({ username: user.username, email: user.email });
    } else {
      return res.status(404).send({ message: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
});
// User Authentication Routes
app.get('/signin', (req, res) => {
  res.sendFile(__dirname + '/signin.html');
});
app.post('/signup', async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });
    res.send({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: req.body.username } });
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid Password!" });
    }
    req.session.username = req.body.username;
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
});
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send({ message: 'Logout failed. Please try again.' });
    }
    res.clearCookie('connect.sid'); // Replace 'connect.sid' with the name of your session cookie if different
    return res.status(200).send({ message: 'Logged out successfully' });
  });
});



app.get('/tasks', async (req, res) => {
  //res.status(200).json(tasks);
  try {
    // Fetch all tasks from the database
    const tasks = await Task.findAll();

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Route to fetch a specific task by ID
app.get('/tasks/:taskId', (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    res.status(200).json(task);
  } else {
    res.status(404).send({ message: 'Task not found.' });
  }
});


app.post('/tasks', async (req, res) => {
  const { name, description, deadline } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Task name is required.' });
  }

  try {
    const newTask = await Task.create({
      name,
      description,
      deadline,
      completed: false
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error saving task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.put('/tasks/completed/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    task.completed = true;
    await task.save();

    res.status(200).json({ message: 'Task marked as complete.', task });
  } catch (error) {
    console.error('Error marking task as complete:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.put('/tasks/:taskId/set-reminder', async(req, res) => {
  /*
  // Extract taskId from URL parameters
  const taskId = parseInt(req.params.taskId);
  // Extract reminderDateTime from request body
  const { reminderDateTime } = req.body;
  // Find task by taskId
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex > -1) {
    // Update task with reminderDateTime
    tasks[taskIndex].reminder = reminderDateTime;
    // Respond with success message
    res.status(200).json({
      message: 'Reminder set successfully',
      task: tasks[taskIndex]
    });
  } else {
    // If no task is found, respond with an error message
    res.status(404).json({ message: 'Task not found.' });
  }*/
  try {
    const { reminderDateTime } = req.body;
    const taskId = parseInt(req.params.taskId);

    // Find or create the task
    const task = await Task.findByPk(taskId );

    // Create or update the associated reminder
    const reminder = await Reminder.create({
      taskId: task.id,
      reminderDateTime: new Date(reminderDateTime),
    });
    //reminder.belongsTo(task);
    //task.associate(reminder);
    // Respond with success message
    res.status(200).json({
      message: 'Reminder set successfully',
    });
  } catch (error) {
    console.error('Error setting reminder:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }

});



app.put('/tasks/:id', async (req, res) => {
  // Parse the task ID from the URL parameter to an integer
  const taskId = parseInt(req.params.id);

  // Extract the updated task details from the request body
  const { name, description, deadline, completed } = req.body;

  try {
    // Use Sequelize to find the task by ID
    const task = await Task.findByPk(taskId);

    // If task not found, return 404
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Update the task with the new details
    task.name = name;
    task.description = description;
    task.deadline = deadline;
    task.completed = completed;

    // Save the updated task to the database
    await task.save();

    // Respond with the updated task as the response
    res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});




app.delete('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  try {
    // Use Sequelize to find the task by ID
    const task = await Task.findByPk(taskId);

    // If task not found, return 404
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Delete the task
    await task.destroy();

    // Respond with success message
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Server Start
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});