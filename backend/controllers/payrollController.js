const asyncHandler = require('express-async-handler');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');

const daysInMonth = (month, year) => new Date(year, month, 0).getDate();

// @desc  HR/Admin generates payroll for one employee for a given month/year
// @route POST /api/payroll/generate
const generatePayroll = asyncHandler(async (req, res) => {
  const { employee: employeeId, month, year } = req.body;
  if (!employeeId || !month || !year) {
    res.status(400);
    throw new Error('employee, month and year are required');
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  const existing = await Payroll.findOne({ employee: employeeId, month, year });
  if (existing) {
    res.status(400);
    throw new Error('Payroll for this employee/month/year has already been generated');
  }

  // Approved unpaid leave days in the month count as Loss of Pay (LOP)
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const unpaidLeaves = await Leave.find({
    employee: employeeId,
    leaveType: 'unpaid',
    status: 'approved',
    startDate: { $lte: monthEnd },
    endDate: { $gte: monthStart },
  });
  const lopDays = unpaidLeaves.reduce((sum, l) => sum + l.days, 0);

  const { basic = 0, hra = 0, allowances = 0, deductions = 0 } = employee.salary || {};
  const grossPay = basic + hra + allowances;
  const perDay = grossPay / daysInMonth(month, year);
  const lopAmount = Math.round(perDay * lopDays);
  const netPay = Math.max(0, Math.round(grossPay - deductions - lopAmount));

  const payroll = await Payroll.create({
    employee: employeeId,
    month,
    year,
    basic,
    hra,
    allowances,
    deductions,
    lopDays,
    lopAmount,
    grossPay,
    netPay,
    generatedBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Payroll generated', data: payroll });
});

// @desc  HR/Admin: bulk-generate payroll for all active employees for a month/year (skips existing)
// @route POST /api/payroll/generate-bulk
const generateBulkPayroll = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  if (!month || !year) {
    res.status(400);
    throw new Error('month and year are required');
  }
  const employees = await Employee.find({ status: { $in: ['active', 'onboarding'] } });

  const results = { created: [], skipped: [] };
  for (const employee of employees) {
    const existing = await Payroll.findOne({ employee: employee._id, month, year });
    if (existing) {
      results.skipped.push(employee.employeeId);
      continue;
    }
    const { basic = 0, hra = 0, allowances = 0, deductions = 0 } = employee.salary || {};
    const grossPay = basic + hra + allowances;
    const netPay = Math.max(0, grossPay - deductions);
    const payroll = await Payroll.create({
      employee: employee._id, month, year, basic, hra, allowances, deductions,
      lopDays: 0, lopAmount: 0, grossPay, netPay, generatedBy: req.user._id,
    });
    results.created.push(payroll);
  }

  res.status(201).json({ success: true, message: `Payroll generated for ${results.created.length} employee(s)`, data: results });
});

// @desc  Get payroll/payslips for logged-in employee
// @route GET /api/payroll/me
const getMyPayroll = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee;
  if (!employeeId) return res.json({ success: true, data: [] });
  const records = await Payroll.find({ employee: employeeId }).sort({ year: -1, month: -1 });
  res.json({ success: true, data: records });
});

// @desc  Admin/HR: list payroll records (filter by employee/month/year)
// @route GET /api/payroll
const getAllPayroll = asyncHandler(async (req, res) => {
  const { employee, month, year, status } = req.query;
  const query = {};
  if (employee) query.employee = employee;
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);
  if (status) query.status = status;
  const records = await Payroll.find(query)
    .sort({ year: -1, month: -1 })
    .populate('employee', 'name employeeId department designation');
  res.json({ success: true, data: records });
});

// @desc  Get single payslip
// @route GET /api/payroll/:id
const getPayslip = asyncHandler(async (req, res) => {
  const payslip = await Payroll.findById(req.params.id).populate('employee');
  if (!payslip) {
    res.status(404);
    throw new Error('Payslip not found');
  }
  if (req.user.role === 'employee' && String(req.user.employee) !== String(payslip.employee._id)) {
    res.status(403);
    throw new Error('Access denied: you may only view your own payslip');
  }
  res.json({ success: true, data: payslip });
});

// @desc  Mark payroll record as paid
// @route PUT /api/payroll/:id/mark-paid
const markPaid = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) {
    res.status(404);
    throw new Error('Payslip not found');
  }
  payroll.status = 'paid';
  payroll.paidOn = new Date();
  await payroll.save();
  res.json({ success: true, message: 'Marked as paid', data: payroll });
});

module.exports = {
  generatePayroll,
  generateBulkPayroll,
  getMyPayroll,
  getAllPayroll,
  getPayslip,
  markPaid,
};
