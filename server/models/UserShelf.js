const mongoose = require('mongoose');

const UserShelfSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  status: {
    type: String,
    enum: ['Want to Read', 'Currently Reading', 'Read'],
    default: 'Want to Read',
  },
  progress: { type: Number, default: 0 }, // ০ থেকে ১০০%
});

module.exports = mongoose.model('UserShelf', UserShelfSchema);
