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
const Subtask =db.subtask;
const Reminder = db.reminder;
const cron = require('node-cron');

const dayjs = require ("dayjs");
const {google} = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
);

const scopes = [
  'https://www.googleapis.com/auth/calendar'
];

const calendar = google.calendar({
  version: "v3",
  auth : process.env.API_KEY
});




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

// Example middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
  if (req.session.username) {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page or return an error response
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Routes for static pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/files/register.html');
});

app.get('/google', async (req,res)=>{
  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',

    // If you only need one scope you can pass it as a string
    scope: scopes
  });
  res.redirect(url);

});

app.get('/google/redirect', async (req, res) => {
  const code = req.query.code;
  const {tokens} = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);


  res.redirect('/push_tasks_to_calendar');

})

app.get('/schedule_event', (req,res) =>{
  //oauth2Client.getTokenInfo().then(info=> info.)
  calendar.events.insert({
    calendarId: 'primary',
    auth: oauth2Client,
    requestBody:{
      summary: 'this is a test event',
      description: 'important event',
      start:{
        dateTime : dayjs(new Date()).add(1, 'day').toISOString(),
        timeZone: "Europe/Vienna",
      },
      end: {
        dateTime: dayjs(new Date()).add(1, 'day').add(1, 'day').toISOString(),
        timeZone: "Europe/Vienna",
      }
    }
  })
})
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




app.get('/tasks',authenticateUser, async (req, res) => {
  //res.status(200).json(tasks);

  try {
    // Assuming you have the userId stored in the session
    const username = req.session.username;
    console.log(username);

    const tasks = await Task.findAll({
        where: {
          username: {
            [Sequelize.Op.like]: username
          }
        }
      },
      );


    // Now you can use the tasks variable containing the results
    //console.log(tasks);

    // Send the tasks as a response or perform other operations
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


app.post('/tasks',authenticateUser, async (req, res) => {
  const { name, description, deadline ,category, priority } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Task name is required.' });
  }

  try {
    const username = req.session.username;
    //console.log('username');

    const newTask = await Task.create({
      name,
      description,
      deadline,
      category,
      completed: false,
      inCalendar: false,
      username,
      priority

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
  const { name, description, deadline, completed, category, priority } = req.body;

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
    task.priority = priority;

    // Save the updated task to the database
    await task.save();
    console.log(task.name + task.priority);


    // Respond with the updated task as the response
    res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});




app.delete('/tasks/:id', authenticateUser, async (req, res) => {
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

app.get('/tasks/category/completed', authenticateUser, async (req, res) => {
  try {
    const username = req.session.username;
    const completedTasks = await Task.findAll({
      where: {
        username: {
          [Sequelize.Op.like]: username
        },
        completed: true,
      }
    });

    if (completedTasks.length > 0) {
      res.status(200).json(completedTasks);
    } else {
      res.status(404).send({ message: 'No completed tasks found for the user.' });
    }
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.get('/tasks/category/open', authenticateUser, async (req, res) => {
  try {
    const username = req.session.username;
    const openTasks = await Task.findAll({
      where: {
        username: {
          [Sequelize.Op.like]: username
        },
        completed: false,
      }
    });

    if (openTasks.length > 0) {
      res.status(200).json(openTasks);
    } else {
      res.status(404).send({ message: 'No open tasks found for the user.' });
    }
  } catch (error) {
    console.error('Error fetching open tasks:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.get('/tasks/category/closed', authenticateUser, async (req, res) => {
  try {
    const username = req.session.username;

    // For debugging purposes, log the username to verify it's correct
    //console.log('Username:', username);

    const pastDeadlineTasks = await Task.findAll({
      where: {
        username: {
          [Sequelize.Op.like]: username
        },
        //completed: false,
        deadline: {
          [Sequelize.Op.lt]: new Date() // Find tasks with a deadline in the past
        }
      }
    });

    if (pastDeadlineTasks.length > 0) {
      res.status(200).json(pastDeadlineTasks);
    } else {
      res.status(404).send({ message: 'No tasks past the deadline found for the user.' });
    }
  } catch (error) {
    console.error('Error fetching past deadline tasks:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


app.get('/tasks/category/:category', authenticateUser, async (req, res) => {
  const category = req.params.category;
  const username = req.session.username;

  try {
    const username = req.session.username;
    const tasks = await Task.findAll({
      attributes: ['id', 'name', 'description', 'deadline', 'reminderDateTime', 'completed', 'category', 'createdAt', 'updatedAt', 'priority'],
      where: {
        category: {
          [Sequelize.Op.like]: `%${category}%`
        },
        username: {
          [Sequelize.Op.like]: username
        }
      }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/push_tasks_to_calendar', authenticateUser,  async (req, res) => {

  try {

    const username = req.session.username;
    console.log(username);

    const tasks = await Task.findAll({
          where: {
            username: {
              [Sequelize.Op.like]: username
            },
            completed: false,
            inCalendar: false
          }
        },
    );

    // Iterate over tasks and add events to Google Calendar
    for (const task of tasks) {

      if (!task.inCalendar) {
        // Update the inCalendar field
        task.inCalendar = true;

        // Save the changes to the database
        await task.save();

      const event = await calendar.events.insert({
        calendarId: 'primary',
        auth: oauth2Client,
        requestBody: {
          summary: task.name,
          description: task.description,
          start: {
            dateTime: dayjs(task.deadline).toISOString(),
            timeZone: 'Europe/Vienna', // Replace with your desired timezone
          },
          end: {
            dateTime: dayjs(task.deadline).add(1, 'day').toISOString(),
            timeZone: 'Europe/Vienna', // Replace with your desired timezone
          },
        },
      });

      console.log(`Event created for task ${task.id}:`, event.data);
    }}

    //res.status(200).json({ message: 'Events created successfully' });
    return res.redirect('/dashboard');

  } catch (error) {
    console.error('Error creating events:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.put('/tasks/:taskId/subtasks', authenticateUser, async (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const { title, description } = req.body;

  try {
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const subtask = await Subtask.create({ title, description, taskId: taskId });
    res.status(201).json(subtask);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});







app.post('/tasks/:taskId/share', async (req, res) => {
  const { usernames } = req.body;
  const taskId = req.params.taskId;

  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Update the sharedWith field with the provided usernames
    task.sharedWith = usernames;
    await task.save();

    res.status(200).json({ message: 'Task shared successfully.' });
  } catch (error) {
    console.error('Error sharing task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/users/:username/shared-tasks', async (req, res) => {
  const username = req.params.username;

  try {
    // Fetch tasks that are shared with the specified user
    const sharedTasks = await Task.findAll({
      where: {
        sharedWith: {
          [Sequelize.Op.like]: [username], // Assuming sharedWith is an array of user IDs
        },
      },
    });

    res.status(200).json(sharedTasks);
  } catch (error) {
    console.error('Error fetching shared tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Server Start
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});