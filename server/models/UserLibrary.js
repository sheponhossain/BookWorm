const mongoose = require('mongoose');

const userLibrarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  books: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
      shelf: {
        type: String,
        enum: ['Want to Read', 'Currently Reading', 'Read'],
        default: 'Want to Read',
      },
      pagesRead: { type: Number, default: 0 },
      totalPages: { type: Number, default: 0 },
      rating: { type: Number, default: 0 }, // ইউজারের ব্যক্তিগত রেটিং
      updatedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('UserLibrary', userLibrarySchema);
