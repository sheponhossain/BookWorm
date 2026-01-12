const mongoose = require('mongoose'); // এই লাইনটি মিসিং ছিল

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: String,
  coverImage: String,
  description: String,
  reviews: [reviewSchema], // এখানে আমরা রিভিউ স্কিমাটি যুক্ত করলাম
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Book', bookSchema);
