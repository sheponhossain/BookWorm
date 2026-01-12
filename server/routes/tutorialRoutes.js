const express = require('express');
const router = express.Router();
const Tutorial = require('../models/Tutorial');

// সব টিউটোরিয়াল পাওয়া
router.get('/', async (req, res) => {
  try {
    const tutorials = await Tutorial.find({}).sort({ createdAt: -1 });
    res.json(tutorials);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// নতুন টিউটোরিয়াল অ্যাড (Admin Only)
router.post('/', async (req, res) => {
  try {
    const newTutorial = new Tutorial(req.body);
    await newTutorial.save();
    res.status(201).json(newTutorial);
  } catch (err) {
    res.status(500).json({ message: 'Error adding tutorial' });
  }
});

module.exports = router;
