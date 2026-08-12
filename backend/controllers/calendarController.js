const asyncHandler = require('express-async-handler');
const Holiday = require('../models/Holiday');
const Leave = require('../models/Leave');
const OfferLetter = require('../models/OfferLetter');

// @desc  List holidays (optionally filter by year)
// @route GET /api/calendar/holidays
const getHolidays = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const query = {};
  if (year) query.date = { $regex: `^${year}` };
  const holidays = await Holiday.find(query).sort({ date: 1 });
  res.json({ success: true, data: holidays });
});

// @desc  Admin/HR: add a company holiday
// @route POST /api/calendar/holidays
const createHoliday = asyncHandler(async (req, res) => {
  const { name, date, type, description } = req.body;
  if (!name || !date) {
    res.status(400);
    throw new Error('name and date are required');
  }
  const holiday = await Holiday.create({ name, date, type, description, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Holiday added', data: holiday });
});

// @desc  Admin/HR: remove a holiday
// @route DELETE /api/calendar/holidays/:id
const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) {
    res.status(404);
    throw new Error('Holiday not found');
  }
  await holiday.deleteOne();
  res.json({ success: true, message: 'Holiday removed' });
});

// @desc  Shared team calendar: approved leaves + holidays + upcoming onboarding, merged for a given month/year
// @route GET /api/calendar/events
const getCalendarEvents = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0, 23, 59, 59);

  const [holidays, leaves, offers] = await Promise.all([
    Holiday.find({ date: { $regex: `^${y}-${String(m).padStart(2, '0')}` } }),
    Leave.find({
      status: 'approved',
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    }).populate('employee', 'name employeeId department'),
    // Onboarding schedules relevant to HR/Admin only
    req.user.role === 'employee'
      ? Promise.resolve([])
      : OfferLetter.find({
          status: { $in: ['accepted', 'onboarded'] },
          joiningDate: { $gte: monthStart, $lte: monthEnd },
        }),
  ]);

  const events = [
    ...holidays.map((h) => ({
      id: h._id,
      type: 'holiday',
      title: h.name,
      date: h.date,
      meta: { holidayType: h.type, description: h.description },
    })),
    ...leaves.map((l) => ({
      id: l._id,
      type: 'leave',
      title: `${l.employee?.name || 'Employee'} - ${l.leaveType} leave`,
      date: l.startDate,
      endDate: l.endDate,
      meta: { employee: l.employee, leaveType: l.leaveType, days: l.days },
    })),
    ...offers.map((o) => ({
      id: o._id,
      type: 'onboarding',
      title: `${o.candidateName} joining - ${o.designation}`,
      date: o.joiningDate,
      meta: { department: o.department, status: o.status },
    })),
  ];

  res.json({ success: true, data: events });
});

module.exports = { getHolidays, createHoliday, deleteHoliday, getCalendarEvents };
