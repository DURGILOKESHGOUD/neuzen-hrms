const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Verifies JWT, attaches req.user (full user doc minus password)
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized: no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('Not authorized: user no longer exists');
    }
    if (!user.isActive) {
      res.status(403);
      throw new Error('Account is deactivated. Contact your administrator.');
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized: invalid or expired token');
  }
});

// Role-based access control - usage: authorize('admin', 'hr')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied: requires role [${allowedRoles.join(', ')}]`);
    }
    next();
  };
};

module.exports = { protect, authorize };
