const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session'); // Import express-session
const axios = require('axios');

dotenv.config();

const app = express();
const port = 3000;
const User = require('./models/mongodb'); // Adjust the path as necessary
const CommunityPost = require('./models/community');

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


app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message; // Clear the message after it's used
  next();
});


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

app.get('/reuse', (req, res) =>{
  res.render('reuse', { user: req.session.user });
})
const recyclingFactories = [
  { name: 'Recycling Factory A', address: '123 Main St, City', contact: '(555) 123-4567' },
  { name: 'Recycling Factory B', address: '456 Elm St, City', contact: '(555) 987-6543' },
  { name: 'Recycling Factory C', address: '789 Oak St, City', contact: '(555) 555-5555' }
];
app.get('/recycle', (req, res) => {
  // Get user location from request (this can be enhanced with actual geolocation)
  const userLocation = { latitude: 0, longitude: 0 }; // Replace with real location fetching logic

  // Filter nearby factories (mock logic, enhance with actual geolocation)
  const nearbyFactories = recyclingFactories; // Here you could filter based on distance

  res.render('recycle', { user: req.user, factories: nearbyFactories });
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

app.get('/ecofriendly',(req, res) =>{
  const user = req.session.user; // Retrieve the user from the session
  if (!user) {
    return res.redirect('/login'); // Redirect to login if not logged in
    }
    res.render('ecofriendly', { user }); // Pass the user object to the view
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
        return res.render('login', { error: 'No user' });
      }

      if (password !== user.password) {
        return res.render('login', { error: 'Invalid email or password' });
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

app.post('/add-topwear', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to add a dress.' });
  }

  const { topwear } = req.body;
  const userId = req.session.user._id;

  try {
    const user = await User.findById(userId);

    // Check if the dress already exists
    if (user.Topwear.includes(topwear)) {
      req.session.message = { type: 'error', text: 'You already have this dress in your wardrobe.' };
      return res.redirect('/wardrobe');
    }

    // Add the dress if it's not a duplicate
    user.Topwear.push(topwear);
    await user.save();

    req.session.message = { type: 'success', text: 'Dress added successfully!' };
    return res.redirect('/');
  } catch (error) {
    console.error('Error adding dress:', error.message);
    req.session.message = { type: 'error', text: 'Server error. Please try again later.' };
    return res.redirect('/');
  }
});

app.post('/add-bottomwear', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to add a dress.' });
  }

  const { bottomwear } = req.body;
  const userId = req.session.user._id;

  try {
    const user = await User.findById(userId);

    // Check if the dress already exists
    if (user.Bottomwear.includes(bottomwear)) {
      req.session.message = { type: 'error', text: 'You already have this dress in your wardrobe.' };
      return res.redirect('/');
    }

    // Add the dress if it's not a duplicate
    user.Bottomwear.push(bottomwear);
    await user.save();

    req.session.message = { type: 'success', text: 'Dress added successfully!' };
    return res.redirect('/');
  } catch (error) {
    console.error('Error adding dress:', error.message);
    req.session.message = { type: 'error', text: 'Server error. Please try again later.' };
    return res.redirect('/');
  }
});



  app.post('/add-accessory', async (req, res) => {
    const { accessory } = req.body;
    const userId = req.session.user._id;
  
    try {
      const user = await User.findById(userId);
      // Check if the accessory already exists
      if (user.accessories.includes(accessory)) {
        return res.status(400).json({ error: 'You already have this accessory in your wardrobe.' });
      }
  
      user.accessories.push(accessory);
      await user.save();
      res.redirect('/');
    } catch (error) {
      console.error('Error adding accessory:', error.message);
      res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  });
  
  app.post('/add-item', async (req, res) => {
    const { personalItem } = req.body;
    const userId = req.session.user._id;
  
    try {
      const user = await User.findById(userId);
      // Check if the personal item already exists
      if (user.personalItems.includes(personalItem)) {
        return res.status(400).json({ error: 'You already have this item in your collection.' });
      }
  
      user.personalItems.push(personalItem);
      await user.save();
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



//community
// Community Engage Page
app.get('/community', async (req, res) => {
  try {
      const posts = await CommunityPost.find().sort({ createdAt: -1 }); // Fetch posts sorted by latest first
      res.render('community', { user: req.session.user, posts });
  } catch (error) {
      console.error('Error fetching community posts:', error.message);
      res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Post a new community message
app.post('/community/post', async (req, res) => {
  if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to post.' });
  }

  const { text } = req.body;
  const username = req.session.user.username;

  try {
      const newPost = new CommunityPost({ username, text });
      await newPost.save();
      res.redirect('/community');
  } catch (error) {
      console.error('Error posting message:', error.message);
      res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Reply to a community post
app.post('/community/reply/:postId', async (req, res) => {
  const { text } = req.body;
  const username = req.session.user.username;
  const postId = req.params.postId;

  try {
      const post = await CommunityPost.findById(postId);
      if (!post) {
          return res.status(404).json({ error: 'Post not found.' });
      }
      post.replies.push({ username, text });
      await post.save();
      res.redirect('/community');
  } catch (error) {
      console.error('Error replying to post:', error.message);
      res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});
const orphanages = [
  { name: 'Orphanage A', address: '123 Main St, City' },
  { name: 'Orphanage B', address: '456 Elm St, City' },
  { name: 'Orphanage C', address: '789 Pine St, City' }
];

app.get('/api/orphanages', (req, res) => {
  const { lat, lng } = req.query;

  res.json(orphanages);
});

// Route to render the donate page
app.get('/donate', (req, res) => {
  res.render('donate');
})