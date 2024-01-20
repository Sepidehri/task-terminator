let tasks = [];
require('dotenv').config()
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const db = require("./models");
const User = db.user;
const Task = db.task;
const Reminder = db.reminder;
const cron = require('node-cron');

var session = require('express-session')
const {Op, Sequelize} = require("sequelize");
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
  res.sendFile(__dirname + '/files/register.html');
});
// User account route - serves the account page and should be protected to ensure only logged-in users can access it
app.get('/dashboard', (req, res) => {
  if (!req.session.username) {
    // If there is no session, redirect to the login page or send an unauthorized response
    return res.redirect('/');
  }
  res.sendFile(__dirname + '/files/dashboard.html');
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
  res.sendFile(__dirname + '/files/signin.html');
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
  console.log("Logout route hit"); // This line is for debugging
  req.session.destroy(err => {
    if (err) {
      console.log('Logout error:', err); // Additional debugging
      return res.status(500).send({ message: 'Logout failed. Please try again.' });
    }
    res.clearCookie('connect.sid'); // Make sure 'connect.sid' matches your session cookie name
    return res.redirect('/'); // Redirect to the login page
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



app.get('/tasks/completed', async (req, res) => {
  try {
    const completedTasks = await Task.findAll({
      where: { completed: true }
    });

    if (completedTasks.length > 0) {
      res.status(200).json(completedTasks);
    } else {
      res.status(404).send({ message: 'No completed tasks found.' });
    }
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});









app.post('/tasks', async (req, res) => {
  const { name, description, deadline ,category } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Task name is required.' });
  }

  try {
    const newTask = await Task.create({
      name,
      description,
      deadline,
      category,
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



app.put('/tasks/:taskId/set-reminder', async (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const { reminderDateTime } = req.body;

  try {
    // Fetch the task from the database
    const task = await Task.findByPk(taskId);

    // Check if the task exists
    if (!task) {
      return res.status(404).send({ message: 'Task not found.' });
    }

    // Update the task's reminder date and time
    task.reminderDateTime = new Date(reminderDateTime);

    // Save the updated task to the database
    await task.save();

    // Respond with a success message
    res.status(200).send({ message: 'Reminder set successfully', task });
  } catch (error) {
    // Handle any errors that occur
    console.error('Error setting reminder:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});




app.put('/tasks/:id', async (req, res) => {
  // Parse the task ID from the URL parameter to an integer
  const taskId = parseInt(req.params.id);

  // Extract the updated task details from the request body
  const { name, description, deadline, completed, category } = req.body;

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
    task.category = category;

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

app.get('/tasks/category/:category', async (req, res) => {
  const category = req.params.category;

  try {
    const tasks = await Task.findAll({
      attributes: ['id', 'name', 'description', 'deadline', 'reminderDateTime', 'completed', 'category', 'createdAt', 'updatedAt'],
      where: {
        category: {
          [Sequelize.Op.like]: `%${category}%`
        }
      }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
/* DEBUGGING USE
cron.schedule('* * * * *', async () => {
    console.log("Looking for reminders");
    // Get tasks from your database and send push notifications
    const tasks = await Task.findAll({ attributes: ['id', 'name', 'description', 'deadline', 'reminderDateTime']});
    //console.log(tasks);

    tasks.forEach((task) => {
     // console.log(task.name)
      var reminderTime = new Date(task.reminderDateTime).getTime();
      console.log("reminderTime :" + reminderTime);
      var now = new Date().getTime();
      //console.log("current Time" + now)
      var timeUntilReminder = reminderTime - now;
     //console.log("difference"+ timeUntilReminder)


      if (timeUntilReminder > 0) {
        setTimeout(function () {
          console.log("REMINDER!!!!")
        }, timeUntilReminder);
      }
});
});*/



// Server Start
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});