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

app.get('/header', (req, res) => {
  res.sendFile(__dirname + '/header.html');
});

app.get('/footer', (req, res) => {
  res.sendFile(__dirname + '/footer.html');
});


// User account route - serves the account page and should be protected to ensure only logged-in users can access it
app.get('/account', (req, res) => {
  if (!req.session.username) {
    // If there is no session, redirect to the login page or send an unauthorized response
    return res.redirect('/signin');
  }
  res.sendFile(__dirname + '/account.html');
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

app.get('/contactus', (req, res) => {
  res.sendFile(__dirname + '/contactus.html');
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



app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

app.post('/tasks', (req, res) => {
  const { name, description, deadline } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Task name is required.' });
  }
  const newTask = {
    id: tasks.length + 1,  // Consider a more robust ID generation strategy
    name,
    description,
    deadline,
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});


app.put('/tasks/:id', (req, res) => {
  // Parse the task ID from the URL parameter to an integer
  const taskId = parseInt(req.params.id);

  // Extract the updated task details from the request body
  const { name, description, deadline } = req.body;

  // Find the index of the task in the array
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  // If a task with the given ID exists, update it
  if (taskIndex > -1) {
    tasks[taskIndex] = {
      ...tasks[taskIndex], // Spread the existing task to preserve other properties
      name,               // Update name
      description,        // Update description
      deadline            // Update deadline
    };
    // Send the updated task as the response
    res.status(200).json(tasks[taskIndex]);
  } else {
    // If the task was not found, send a 404 Not Found response
    res.status(404).json({ message: 'Task not found.' });
  }
});




app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found.' });
  }
  tasks.splice(taskIndex, 1);
  res.status(200).json({ message: 'Task deleted successfully.' });
});

// Server Start
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

