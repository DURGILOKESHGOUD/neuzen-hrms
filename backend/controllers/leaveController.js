const asyncHandler = require('express-async-handler');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

const daysBetween = (start, end) => {
  const ms = new Date(end) - new Date(start);
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
};

// @desc  Employee applies for leave
// @route POST /api/leaves
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const employeeId = req.user.employee;
  if (!employeeId) {
    res.status(400);
    throw new Error('No employee profile linked to this account');
  }
  if (!leaveType || !startDate || !endDate || !reason) {
    res.status(400);
    throw new Error('leaveType, startDate, endDate and reason are required');
  }
  if (new Date(endDate) < new Date(startDate)) {
    res.status(400);
    throw new Error('endDate cannot be before startDate');
  }

  const days = daysBetween(startDate, endDate);

  if (leaveType !== 'unpaid') {
    const employee = await Employee.findById(employeeId);
    const available = employee.leaveBalance[leaveType];
    if (available === undefined) {
      res.status(400);
      throw new Error('Invalid leave type');
    }
    if (days > available) {
      res.status(400);
      throw new Error(`Insufficient ${leaveType} leave balance. Available: ${available} day(s)`);
    }
  }

  const leave = await Leave.create({ employee: employeeId, leaveType, startDate, endDate, days, reason });
  res.status(201).json({ success: true, message: 'Leave request submitted', data: leave });
});

// @desc  Get leaves for logged-in employee
// @route GET /api/leaves/me
const getMyLeaves = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee;
  if (!employeeId) return res.json({ success: true, data: [] });
  const leaves = await Leave.find({ employee: employeeId }).sort({ createdAt: -1 });
  res.json({ success: true, data: leaves });
});

// @desc  Admin/HR: list all leave requests (optionally filter by status)
// @route GET /api/leaves
const getAllLeaves = asyncHandler(async (req, res) => {
  const { status, employee } = req.query;
  const query = {};
  if (status) query.status = status;
  if (employee) query.employee = employee;
  const leaves = await Leave.find(query)
    .sort({ createdAt: -1 })
    .populate('employee', 'name employeeId department designation')
    .populate('reviewedBy', 'name role');
  res.json({ success: true, data: leaves });
});

// @desc  Admin/HR approves or rejects a leave request
// @route PUT /api/leaves/:id/review
const reviewLeave = asyncHandler(async (req, res) => {
  const { status, comment } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('status must be approved or rejected');
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }
  if (leave.status !== 'pending') {
    res.status(400);
    throw new Error(`This leave request has already been ${leave.status}`);
  }

  leave.status = status;
  leave.reviewComment = comment || '';
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();

  if (status === 'approved') {
    const employee = await Employee.findById(leave.employee);
    if (leave.leaveType !== 'unpaid' && employee.leaveBalance[leave.leaveType] !== undefined) {
      employee.leaveBalance[leave.leaveType] = Math.max(0, employee.leaveBalance[leave.leaveType] - leave.days);
      await employee.save();
    }

    // Mark attendance as on-leave for each day in range
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const ops = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      ops.push(
        Attendance.findOneAndUpdate(
          { employee: leave.employee, date: dateStr },
          { status: 'on-leave' },
          { upsert: true, setDefaultsOnInsert: true }
        )
      );
    }
    await Promise.all(ops);
  }

  res.json({ success: true, message: `Leave ${status}`, data: leave });
});

// @desc  Employee cancels own pending leave request
// @route PUT /api/leaves/:id/cancel
const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }
  if (String(leave.employee) !== String(req.user.employee)) {
    res.status(403);
    throw new Error('You can only cancel your own leave requests');
  }
  if (leave.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending leave requests can be cancelled');
  }
  leave.status = 'cancelled';
  await leave.save();
  res.json({ success: true, message: 'Leave request cancelled', data: leave });
});

module.exports = { applyLeave, getMyLeaves, getAllLeaves, reviewLeave, cancelLeave };
