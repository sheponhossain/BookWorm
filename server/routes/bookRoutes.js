const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User'); // ইউজার মডেলটি ইম্পোর্ট করতে হবে
const Tutorial = require('../models/Tutorial'); // টিউটোরিয়াল মডেল (নিচে স্কিমা বলে দিচ্ছি)
const { adminOnly } = require('../middlewares/auth');

// ---------------------------------------------------------
// ১. সবার জন্য উন্মুক্ত রাউট (Public Routes)
// ---------------------------------------------------------

/** @desc সব বইয়ের লিস্ট পাওয়া */
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 6, genre = 'All' } = req.query;
    const skip = (page - 1) * limit;

    let filterQuery = {};
    if (genre && genre !== 'All') filterQuery.genre = genre;

    const totalBooks = await Book.countDocuments(filterQuery);
    const books = await Book.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const booksWithRating = books.map((book) => {
      // ডকুমেণ্ট অনুযায়ী শুধুমাত্র 'approved' রিভিউগুলো এভারেজ রেটিংয়ে আসবে
      const approvedReviews = book.reviews
        ? book.reviews.filter((r) => r.status === 'approved')
        : [];
      const totalReviews = approvedReviews.length;
      const avgRating =
        totalReviews > 0
          ? (
              approvedReviews.reduce((acc, rev) => acc + rev.rating, 0) /
              totalReviews
            ).toFixed(1)
          : 0;

      return {
        ...book._doc,
        reviews: approvedReviews, // পাবলিকলি শুধু অ্যাপ্রুভড রিভিউ দেখাবে
        avgRating: Number(avgRating),
        totalReviews: totalReviews,
      };
    });

    res.status(200).json({
      books: booksWithRating,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/** @desc স্ট্যাটস ডাটা পাওয়া */
router.get('/stats', async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const activeUsers = await User.countDocuments(); // রিয়েল ইউজার কাউন্ট
    const books = await Book.find();
    let totalReviews = 0;
    books.forEach((b) => (totalReviews += b.reviews ? b.reviews.length : 0));

    res.json({
      totalBooks,
      activeUsers,
      totalReviews,
      readingGoal: '85%',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------
// ২. বুক ম্যানেজমেন্ট (Admin Only)
// ---------------------------------------------------------

router.post('/add', adminOnly, async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json({ success: true, message: 'Book added! 📚' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  try {
    await Book.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Updated! 📝' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted! 🗑️' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------
// ৩. ইউজার ম্যানেজমেন্ট (Admin Only) - NEW
// ---------------------------------------------------------

/** @desc সব ইউজারের লিস্ট দেখা */
router.get('/admin/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** @desc রোল পরিবর্তন করা (Promote/Demote) */
router.put('/admin/users/:id/role', adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ success: true, message: 'Role updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------
// ৪. রিভিউ সিস্টেম ও মডারেশন - UPDATED
// ---------------------------------------------------------

/** @desc ইউজার রিভিউ জমা দিবে (ডিফল্ট স্ট্যাটাস: pending) */
router.post('/:id/review', async (req, res) => {
  try {
    const { user, rating, comment } = req.body;
    const book = await Book.findById(req.params.id);

    book.reviews.push({
      user,
      rating,
      comment,
      status: 'pending', // ডকুমেণ্ট অনুযায়ী মডারেশনে থাকবে
    });

    await book.save();
    res.status(201).json({ message: 'Review submitted for moderation! ⏳' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** @desc সব পেন্ডিং রিভিউ দেখা (Admin Only) */
router.get('/admin/reviews/pending', adminOnly, async (req, res) => {
  try {
    const books = await Book.find({ 'reviews.status': 'pending' });
    let pending = [];
    books.forEach((b) => {
      b.reviews
        .filter((r) => r.status === 'pending')
        .forEach((r) => {
          pending.push({ ...r._doc, bookId: b._id, bookTitle: b.title });
        });
    });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** @desc রিভিউ অ্যাপ্রুভ করা (Admin Only) */
router.put('/admin/reviews/:reviewId/approve', adminOnly, async (req, res) => {
  try {
    const book = await Book.findOne({ 'reviews._id': req.params.reviewId });
    const review = book.reviews.id(req.params.reviewId);
    review.status = 'approved';
    await book.save();
    res.json({ message: 'Review Approved! ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------
// ৫. টিউটোরিয়াল ম্যানেজমেন্ট (YouTube Embed) - NEW
// ---------------------------------------------------------

router.get('/tutorials', async (req, res) => {
  try {
    const tutorials = await Tutorial.find().sort({ createdAt: -1 });
    res.json(tutorials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/tutorials', adminOnly, async (req, res) => {
  try {
    const newTut = new Tutorial(req.body);
    await newTut.save();
    res.status(201).json({ message: 'Tutorial added! 🎥' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
