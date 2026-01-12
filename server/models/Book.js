// models/Book.js (সম্ভাব্য স্ট্রাকচার)
const reviewSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userName: String,
  rating: Number,
  comment: String,
  isApproved: { type: Boolean, default: false }, // অ্যাডমিন এপ্রুভালের জন্য
});

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: String,
  coverImage: String,
  description: String,
  reviews: [reviewSchema],
  // ইউজারদের সেলফ ট্র্যাকিং ডাটাবেসে আলাদা কালেকশনে রাখা ভালো
});
