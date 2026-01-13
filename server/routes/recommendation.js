const express = require('express');
const router = express.Router();
const UserLibrary = require('../models/UserLibrary');
const Book = require('../models/Book');

router.get('/personalized/:userId', async (req, res) => {
  try {
    const library = await UserLibrary.findOne({
      userId: req.params.userId,
    }).populate('books.bookId');

    // ১. যদি ইউজার নতুন হয় (৩টির কম বই পড়েছে)
    if (
      !library ||
      library.books.filter((b) => b.shelf === 'Read').length < 3
    ) {
      const popularBooks = await Book.find()
        .sort({ averageRating: -1 })
        .limit(15);
      return res.json({
        type: 'Popular',
        books: popularBooks,
        reason: "Since you're new, here are some community favorites!",
      });
    }

    // ২. জেনার বিশ্লেষণ
    const readBooks = library.books.filter((b) => b.shelf === 'Read');
    const genreCount = {};
    readBooks.forEach((b) => {
      const genre = b.bookId.genre;
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    const topGenre = Object.keys(genreCount).reduce((a, b) =>
      genreCount[a] > genreCount[b] ? a : b
    );

    // ৩. একই জেনারের হাই-রেটেড বই খোঁজা
    const recommendations = await Book.find({
      genre: topGenre,
      _id: { $nin: library.books.map((b) => b.bookId._id) }, // অলরেডি পড়া বই বাদ
    })
      .sort({ averageRating: -1 })
      .limit(12);

    res.json({
      type: 'Personalized',
      books: recommendations,
      reason: `Matches your preference for ${topGenre} (${genreCount[topGenre]} books read).`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
