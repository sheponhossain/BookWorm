const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST: Login User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, photoURL, role } = req.body; // নতুন ফিল্ডগুলো রিসিভ করা হচ্ছে

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      photoURL: photoURL || '', // ডেটাবেসে ফটো সেভ করা
      role: role || 'user', // ডেটাবেসে রোল সেভ করা
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// POST: Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // চেক করা হচ্ছে ইউজার আগে থেকেই আছে কিনা
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // পাসওয়ার্ড হ্যাশ করা (সিকিউরিটির জন্য)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // নতুন ইউজার তৈরি
    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();
    res
      .status(201)
      .json({ message: 'User registered successfully! Now you can login.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during registration');
  }
});

module.exports = router;
