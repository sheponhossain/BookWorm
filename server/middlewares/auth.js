// server/middleware/auth.js

const adminOnly = (req, res, next) => {
  // ফ্রন্টএন্ড থেকে পাঠানো হেডারের রোল চেক করা হচ্ছে
  const userRole = req.headers['user-role'];

  if (userRole === 'admin') {
    next(); // রোল অ্যাডমিন হলে কাজ করতে দেবে
  } else {
    res.status(403).json({
      message:
        'Access Denied: You do not have permission to perform this action!',
    });
  }
};

module.exports = { adminOnly };
