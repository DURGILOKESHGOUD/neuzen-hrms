const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');
const User = require('../models/User');

const genEmployeeId = async () => {
  const count = await Employee.countDocuments();
  return `NEU-${String(count + 1).padStart(4, '0')}`;
};

// @desc  List employees (Admin/HR: all, Employee: self only via /me)
// @route GET /api/employees
const getEmployees = asyncHandler(async (req, res) => {
  const { department, status, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (department) query.department = department;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [employees, total] = await Promise.all([
    Employee.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Employee.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: employees,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// @desc  Get single employee
// @route GET /api/employees/:id
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate('reportingManager', 'name designation');
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }
  // Employees may only view their own record
  if (req.user.role === 'employee' && String(req.user.employee) !== String(employee._id)) {
    res.status(403);
    throw new Error('Access denied: you may only view your own profile');
  }
  res.json({ success: true, data: employee });
});

// @desc  Create employee (creates linked User account too) - Admin/HR only
// @route POST /api/employees
const createEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    department,
    designation,
    dateOfJoining,
    employmentType,
    role, // account role: 'employee' | 'hr' (admin creation restricted to admin themselves)
    reportingManager,
    salary,
  } = req.body;

  if (!name || !email || !password || !department || !designation || !dateOfJoining) {
    res.status(400);
    throw new Error('name, email, password, department, designation, dateOfJoining are required');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  // Only admin can create HR or Admin accounts; HR can only create 'employee' accounts
  let assignedRole = 'employee';
  if (role && ['hr', 'admin'].includes(role)) {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only Admin can assign HR or Admin roles');
    }
    assignedRole = role;
  }

  const user = await User.create({ name, email: email.toLowerCase(), password, role: assignedRole });

  const employeeId = await genEmployeeId();
  const employee = await Employee.create({
    user: user._id,
    employeeId,
    name,
    email: email.toLowerCase(),
    phone,
    department,
    designation,
    dateOfJoining,
    employmentType,
    reportingManager: reportingManager || null,
    salary,
    status: 'active',
  });

  user.employee = employee._id;
  await user.save();

  res.status(201).json({ success: true, message: 'Employee created', data: employee });
});

// @desc  Update employee - Admin/HR only
// @route PUT /api/employees/:id
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  const allowedFields = [
    'name', 'phone', 'department', 'designation', 'employmentType',
    'status', 'reportingManager', 'address', 'dateOfBirth', 'salary', 'bankDetails',
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) employee[field] = req.body[field];
  });

  await employee.save();
  res.json({ success: true, message: 'Employee updated', data: employee });
});

// @desc  Deactivate/delete employee - Admin only
// @route DELETE /api/employees/:id
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }
  employee.status = 'terminated';
  await employee.save();
  await User.findByIdAndUpdate(employee.user, { isActive: false });

  res.json({ success: true, message: 'Employee deactivated' });
});

// @desc  Update a user's role (Admin only) - RBAC role assignment
// @route PUT /api/employees/:id/role
const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'hr', 'employee'].includes(role)) {
    res.status(400);
    throw new Error('role must be one of: admin, hr, employee');
  }
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }
  const user = await User.findByIdAndUpdate(employee.user, { role }, { new: true });
  res.json({ success: true, message: `Role updated to ${role}`, data: user.toSafeObject() });
});

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  changeUserRole,
};
