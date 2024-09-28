const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// const favicon = require('serve-favicon');

// Serve the favicon
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
const User = require('./models/mongodb.js');

dotenv.config();

const app = express();
const port = 3000;

app.set('view engine','ejs');
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.json()); // for parsing application/json

mongoose.connect('mongodb+srv://vikasjv68:Ziy9JYog3OYo3VCA@bitnbuild.vaee0.mongodb.net/?retryWrites=true&w=majority&appName=bitnbuild', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.log(error));


app.get('/',(req, res) => {
  res.render("home");
})

app.get('/login',(req, res) =>{
  res.render("login");
})

app.get('/signup',(req, res) =>{
  res.render("signup");
})

app.listen(port, () =>{
  console.log('server running on port:');
})


app.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Check if password matches confirm password
  if (password !== confirmPassword) {
      return res.render('signup', { error: 'Passwords do not match' });
  }

  try {
      // Create new user
      const user = new User({
          username,
          email,
          password
      });

      // Save user to the database
      await user.save();

      // Redirect to the home page with a success message
      return res.redirect('/?signup=success');
  } catch (error) {
      // Check for duplicate key error
      if (error.code === 11000 && error.keyPattern.username) {
          return res.render('signup', { error: 'Username already taken. Please choose another one.' });
      }

      // Log any other errors and show a generic error message
      console.log(error); // Log the error
      return res.render('signup', { error: 'Server error. Please try again later.' });
  }
});


// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid email or password' });
      }

      res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error.message);   // Log error message
    console.error('Error stack trace:', error.stack);      // Log stack trace for debugging
    res.status(500).json({ message: 'Server error' });  }
});