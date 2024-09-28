const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session'); // Import express-session

dotenv.config();

const app = express();
const port = 3000;
const User = require('./models/mongodb'); // Adjust the path as necessary

// Middleware for sessions
app.use(session({
    secret: '123456', // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
}));

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));

mongoose.connect('mongodb+srv://vikasjv68:Ziy9JYog3OYo3VCA@bitnbuild.vaee0.mongodb.net/?retryWrites=true&w=majority&appName=bitnbuild', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((error) => console.log(error));

// Routes
app.get('/', async (req, res) => {
  if (req.session.user) {
      try {
          // Fetch the user from the database to get the most updated data
          const user = await User.findById(req.session.user._id);
          
          // Reassign user in session with the fresh data
          req.session.user = user;

          res.render("home", { user });
      } catch (error) {
          console.error('Error fetching user:', error.message);
          res.status(500).json({ error: 'Server error. Please try again later.' });
      }
  } else {
      // Render the home page without user if they are not logged in
      res.render("home", { user: null });
  }
});


app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/signup', (req, res) => {
    res.render("signup");
});

app.get('/wardrobe', (req, res) => {
  const user = req.session.user; // Retrieve the user from the session
  if (!user) {
      return res.redirect('/login'); // Redirect to login if not logged in
  }
  res.render('wardrobe', { user }); // Pass the user object to the view
});


// Signup Route (No Password Hashing)
app.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
      return res.render('signup', { error: 'Passwords do not match' });
  }

  try {
      const user = new User({
          username,
          email,
          password 
      });

      await user.save();
      req.session.user = user; // Set user in session
      return res.redirect('/?signup=success');
  } catch (error) {
      if (error.code === 11000 && error.keyPattern.email) {
          return res.render('signup', { error: 'Email already taken. Please choose another one.' });
      }
      console.log(error);
      return res.render('signup', { error: 'Server error. Please try again later.' });
  }
});

// Login Route 
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(400).json({ error: 'Invalid email or password' });
      }

      if (password !== user.password) {
          return res.status(400).json({ error: 'Invalid email or password' });
      }

      req.session.user = user; // Set user in session
      return res.redirect('/?signup=success');
  } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).json({ error: 'Server error' });
  }
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/'); // Handle error if needed
        }
        res.redirect('/'); // Redirect to home after logout
    });
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

// Add Dress Route
app.post('/add-dress', async (req, res) => {
  // Check if the user is logged in
  if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to add a dress.' });
  }

  const dress = req.body.dress;
  const userId = req.session.user._id; // Get the user's ID from the session

  try {
      // Find the user by ID and add the dress to their collection
      await User.findByIdAndUpdate(userId, { $push: { dresses: dress } });
      // Optionally update session user with latest dresses
      const updatedUser = await User.findById(userId); 
      req.session.user = updatedUser; // Update session with the new data
      res.redirect('/'); // Redirect to the home page after adding the dress
  } catch (error) {
      console.error('Error adding dress:', error.message);
      res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Add Accessory Route
app.post('/add-accessory', async (req, res) => {
  const { accessory } = req.body;
  const userId = req.session.user._id;

  try {
    await User.findByIdAndUpdate(userId, { $push: { accessories: accessory } });
    res.redirect('/');
  } catch (error) {
    console.error('Error adding accessory:', error.message);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Add Personal Item Route
app.post('/add-item', async (req, res) => {
  const { personalItem } = req.body;
  const userId = req.session.user._id;

  try {
    await User.findByIdAndUpdate(userId, { $push: { personalItems: personalItem } });
    res.redirect('/');
  } catch (error) {
    console.error('Error adding personal item:', error.message);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Express route handler for wearing an item
app.post('/wear-item', (req, res) => {
  const { type, item } = req.body;

  // Logic to update the wear count in the database
  // For example, assuming you have a user model with a method to update wear count
  User.findById(req.user.id)
      .then(user => {
          // Increment wear count for the specific item
          // Assuming you have a way to track wears, e.g., a wearCount property
          if (type === 'dress') {
              // Logic to increment dress wear count
              // e.g., user.dresses.find(d => d.name === item).wearCount++;
          } else if (type === 'accessory') {
              // Logic to increment accessory wear count
          } else if (type === 'personalItem') {
              // Logic to increment personal item wear count
          }

          return user.save();
      })
      .then(() => {
          res.status(200).json({ message: 'Wear count updated successfully' });
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({ error: 'Internal Server Error' });
      });
});
