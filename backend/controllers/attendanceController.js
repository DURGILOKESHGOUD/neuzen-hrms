const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

const todayStr = () => new Date().toISOString().slice(0, 10);

// @desc  Employee marks check-in for today
// @route POST /api/attendance/check-in
const checkIn = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee;
  if (!employeeId) {
    res.status(400);
    throw new Error('No employee profile linked to this account');
  }
  const date = todayStr();

  let record = await Attendance.findOne({ employee: employeeId, date });
  if (record && record.checkIn) {
    res.status(400);
    throw new Error('You have already checked in today');
  }

  if (!record) {
    record = await Attendance.create({ employee: employeeId, date, checkIn: new Date(), status: 'present' });
  } else {
    record.checkIn = new Date();
    record.status = 'present';
    await record.save();
  }

  res.status(201).json({ success: true, message: 'Checked in successfully', data: record });
});

// @desc  Employee marks check-out for today
// @route POST /api/attendance/check-out
const checkOut = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee;
  const date = todayStr();

  const record = await Attendance.findOne({ employee: employeeId, date });
  if (!record || !record.checkIn) {
    res.status(400);
    throw new Error('You must check in before checking out');
  }
  if (record.checkOut) {
    res.status(400);
    throw new Error('You have already checked out today');
  }

  record.checkOut = new Date();
  const hours = (record.checkOut - record.checkIn) / (1000 * 60 * 60);
  record.workHours = Math.round(hours * 100) / 100;
  record.status = hours < 4 ? 'half-day' : 'present';
  await record.save();

  res.json({ success: true, message: 'Checked out successfully', data: record });
});

// @desc  Get attendance for logged-in employee (self) or any employee (admin/hr via query)
// @route GET /api/attendance/me
const getMyAttendance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const employeeId = req.user.employee;
  if (!employeeId) {
    return res.json({ success: true, data: [] });
  }
  const query = { employee: employeeId };
  if (month && year) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    query.date = { $regex: `^${prefix}` };
  }
  const records = await Attendance.find(query).sort({ date: -1 });
  res.json({ success: true, data: records });
});

// @desc  Admin/HR: get attendance for any employee, or all employees for a given date
// @route GET /api/attendance
const getAttendanceRecords = asyncHandler(async (req, res) => {
  const { employee, date, month, year } = req.query;
  const query = {};
  if (employee) query.employee = employee;
  if (date) query.date = date;
  if (month && year) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    query.date = { $regex: `^${prefix}` };
  }
  const records = await Attendance.find(query).sort({ date: -1 }).populate('employee', 'name employeeId department designation');
  res.json({ success: true, data: records });
});

// @desc  Admin/HR: manually mark/adjust attendance for an employee (e.g. mark absent)
// @route POST /api/attendance/mark
const markAttendance = asyncHandler(async (req, res) => {
  const { employee, date, status, notes } = req.body;
  if (!employee || !date || !status) {
    res.status(400);
    throw new Error('employee, date and status are required');
  }
  const emp = await Employee.findById(employee);
  if (!emp) {
    res.status(404);
    throw new Error('Employee not found');
  }

  const record = await Attendance.findOneAndUpdate(
    { employee, date },
    { status, notes },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, message: 'Attendance marked', data: record });
});

module.exports = { checkIn, checkOut, getMyAttendance, getAttendanceRecords, markAttendance };
