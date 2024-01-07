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



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.get('/header', (req, res) => {
  res.sendFile(__dirname + '/header.html');
});

app.get('/footer', (req, res) => {
  res.sendFile(__dirname + '/footer.html');
});

//app.get('/register', (req, res) => {
 // res.sendFile(__dirname + '/register.html');
//});

app.get('/signin', (req, res) => {
  res.sendFile(__dirname + '/signin.html');
});

app.get('/contactus', (req, res) => {
  res.sendFile(__dirname + '/contactus.html');
});

app.get('/account', (req, res) => {
  res.sendFile(__dirname + '/account.html');
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
      const user = await User.findOne({
        where: {
          username: req.body.username,
        },
      });
  
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
  
      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
  
      if (!passwordIsValid) {
        return res.status(401).send({
          message: "Invalid Password!",
        });
      }
      req.session.username=req.body.username;
      return res.status(200).send();
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  });

  app.post('/logout', (req, res) => {
    // Clear the session data
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server Error');
      }
      
      return res.status(200).send('Logout successful');
    });
  });
  

  app.get('/account-detail', async (req, res) => {
    try {
      console.log(req.session)
      var usename = req.session.username ;
      const user = await User.findOne({
        where: {
          username: usename,
        },
      });
  
      if (!user) {
        return res.status(401).send({ message: "Unauthorized" });
      }

  
      return res.status(200).send({username:user.username, email:user.email});
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  });

  app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
  
    const deletedUser = users.find(user => user.id === userId);
    if (!deletedUser) {
      return res.status(404).send('User not found');
    }
    const index = users.indexOf(deletedUser);
    users.splice(index, 1);
  
    res.send('User deleted successfully');
  });
  
  let users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  // PUT route to update a user
  app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, email } = req.body;
  
    // Find the user with the specified ID
    const userToUpdate = users.find(user => user.id === userId);
    if (!userToUpdate) {
      return res.status(404).send('User not found');
    }
  
    // Update the user properties
    userToUpdate.name = name || userToUpdate.name;
    userToUpdate.email = email || userToUpdate.email;
  
    res.send('User updated successfully');
  });

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
