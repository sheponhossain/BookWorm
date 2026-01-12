const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
      default: '',
    }, // ডকুমেন্ট অনুযায়ী প্রোফাইল ফটোর ফিল্ড
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    }, // অ্যাডমিন এবং ইউজার রোল ম্যানেজমেন্ট
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
