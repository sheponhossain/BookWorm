const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book'); // রিভিউগুলো বইয়ের ভেতরে থাকলে এটি লাগবে
const Tutorial = require('../models/Tutorial');

// --- USER MANAGEMENT ---

// সকল ইউজার পাওয়া
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// রোল পরিবর্তন (Admin/User)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating role' });
  }
});

// --- REVIEW MODERATION ---

// পেন্ডিং রিভিউ পাওয়া (যেগুলোর status: 'pending')
router.get('/reviews/pending', async (req, res) => {
  try {
    // যদি রিভিউ আলাদা কালেকশনে থাকে:
    // const reviews = await Review.find({ isApproved: false });

    // যদি রিভিউ বইয়ের ভেতরে (Nested) থাকে, তবে সব বই থেকে পেন্ডিং রিভিউ বের করা:
    const books = await Book.find({ 'reviews.isApproved': false });
    let pendingReviews = [];
    books.forEach((book) => {
      book.reviews.forEach((rev) => {
        if (!rev.isApproved) {
          pendingReviews.push({ ...rev._doc, bookId: book._id });
        }
      });
    });
    res.json(pendingReviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// রিভিউ অ্যাপ্রুভ করা
router.put('/reviews/:id/approve', async (req, res) => {
  try {
    await Book.updateOne(
      { 'reviews._id': req.params.id },
      { $set: { 'reviews.$.isApproved': true } }
    );
    res.json({ message: 'Review Approved' });
  } catch (err) {
    res.status(500).json({ message: 'Approve failed' });
  }
});

// রিভিউ ডিলিট/রিজেক্ট করা
router.delete('/reviews/:id', async (req, res) => {
  try {
    await Book.updateOne(
      { 'reviews._id': req.params.id },
      { $pull: { reviews: { _id: req.params.id } } }
    );
    res.json({ message: 'Review Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;
