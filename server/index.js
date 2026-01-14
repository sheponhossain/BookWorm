require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://book-worm-front-end-orpin.vercel.app'];
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(express.json());

const Book = require('./models/Book');

// UserStats Model
const UserStats =
  mongoose.models.UserStats ||
  mongoose.model(
    'UserStats',
    new mongoose.Schema(
      {
        userEmail: { type: String, required: true, unique: true },
        annualGoal: { type: Number, default: 50 },
        readingStreak: { type: Number, default: 0 },
      },
      { timestamps: true }
    )
  );

// Genre Model
const Genre =
  mongoose.models.Genre ||
  mongoose.model(
    'Genre',
    new mongoose.Schema({
      name: { type: String, required: true, unique: true },
    })
  );

app.get('/api/stats/:email', async (req, res) => {
  try {
    let stats = await UserStats.findOne({ userEmail: req.params.email });
    if (!stats) stats = await UserStats.create({ userEmail: req.params.email });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/stats/update-goal', async (req, res) => {
  const { email, newGoal } = req.body;
  try {
    const updatedStats = await UserStats.findOneAndUpdate(
      { userEmail: email },
      { annualGoal: newGoal },
      { new: true, upsert: true }
    );
    res.json(updatedStats);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    const genres = await Genre.find();
    res.json(genres);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/genres/add', async (req, res) => {
  try {
    const newGenre = new Genre({ name: req.body.name });
    await newGenre.save();
    res.status(201).json(newGenre);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/genres/:oldName', async (req, res) => {
  try {
    const updatedGenre = await Genre.findOneAndUpdate(
      { name: req.params.oldName },
      { name: req.body.newName },
      { new: true }
    );
    res.json(updatedGenre);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/genres/:id', async (req, res) => {
  try {
    const deletedGenre = await Genre.findByIdAndDelete(req.params.id);
    if (!deletedGenre)
      return res.status(404).json({ message: 'Genre not found' });
    res.status(200).json({ message: 'Genre deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

app.post('/api/books/:id/review', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const newReview = {
      userName: req.body.userName,
      rating: req.body.rating,
      comment: req.body.comment,
      status: 'pending',
    };

    book.reviews.push(newReview);
    await book.save();
    res.status(200).json({ message: 'Success' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/reviews/pending', async (req, res) => {
  try {
    const books = await Book.find({});
    const pendingReviews = [];

    books.forEach((book) => {
      (book.reviews || []).forEach((rev) => {
        if (rev.status === 'pending') {
          pendingReviews.push({
            ...rev.toObject(),
            bookId: book._id,
            bookTitle: book.title,
          });
        }
      });
    });

    res.json(pendingReviews);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/api/books/all', async (req, res) => {
  try {
    const books = await Book.find({});

    if (!books) {
      return res.status(200).json([]);
    }

    res.status(200).json(books);
  } catch (err) {
    console.error('Backend Search Error:', err);
    res
      .status(500)
      .json({ message: 'Database connection error', error: err.message });
  }
});

app.patch('/api/admin/reviews/moderate', async (req, res) => {
  const { reviewId, bookId, action } = req.body;
  const userRole = req.headers['user-role'];

  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'Access Denied: Admin only' });
  }

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (action === 'approve') {
      const review = book.reviews.id(reviewId);
      if (review) {
        review.status = 'approved';
      }
    } else if (action === 'delete') {
      book.reviews.pull(reviewId);
    }

    await book.save();
    res.json({ message: `Review ${action}d successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error occurred' });
  }
});

app.use(
  cors({
    origin: 'https://your-client-project.vercel.app', // আপনার ফ্রন্টএন্ড লিংক
    credentials: true,
  })
);

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tutorialRoutes = require('./routes/tutorialRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tutorials', tutorialRoutes);

app.get('/', (req, res) => res.send('Server is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
