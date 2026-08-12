const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Employee = require('../models/Employee');
const generateToken = require('../utils/generateToken');

// @desc  Register a new user (Admin only, in production; open for initial admin bootstrap)
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }

  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  // Only admins may create admin/hr accounts directly; public self-signup defaults to employee
  let assignedRole = 'employee';
  if (req.user && req.user.role === 'admin' && role) {
    assignedRole = role;
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: assignedRole,
  });

  const token = generateToken(user._id, user.role);
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user: user.toSafeObject(), token },
  });
});

// @desc  Login
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is deactivated. Contact your administrator.');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id, user.role);
  res.json({
    success: true,
    message: 'Login successful',
    data: { user: user.toSafeObject(), token },
  });
});

// @desc  Get current logged-in user profile (+ linked employee profile if any)
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  let employeeProfile = null;
  if (user.employee) {
    employeeProfile = await Employee.findById(user.employee);
  }
  res.json({
    success: true,
    data: { user: user.toSafeObject(), employeeProfile },
  });
});

// @desc  Change own password
// @route PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('Current password and a new password (min 6 chars) are required');
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = { register, login, getMe, changePassword };
