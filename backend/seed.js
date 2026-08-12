/**
 * Seed script - creates pre-configured test accounts (Admin, HR, Employee)
 * plus a couple of sample holidays. Safe to re-run (skips existing data).
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Holiday = require('./models/Holiday');

const run = async () => {
  await connectDB();

  const accounts = [
    {
      name: 'Neuzen Admin',
      email: 'admin@neuzenai.com',
      password: 'Admin@123',
      role: 'admin',
      makeEmployee: true,
      department: 'Administration',
      designation: 'System Administrator',
    },
    {
      name: 'Priya HR',
      email: 'hr@neuzenai.com',
      password: 'Hr@12345',
      role: 'hr',
      makeEmployee: true,
      department: 'Human Resources',
      designation: 'HR Manager',
    },
    {
      name: 'Arjun Employee',
      email: 'employee@neuzenai.com',
      password: 'Employee@123',
      role: 'employee',
      makeEmployee: true,
      department: 'Engineering',
      designation: 'Software Engineer',
    },
  ];

  for (const acc of accounts) {
    const existing = await User.findOne({ email: acc.email });
    if (existing) {
      console.log(`[SEED] Skipping existing user: ${acc.email}`);
      continue;
    }

    const user = await User.create({
      name: acc.name,
      email: acc.email,
      password: acc.password,
      role: acc.role,
    });

    if (acc.makeEmployee) {
      const count = await Employee.countDocuments();
      const employee = await Employee.create({
        user: user._id,
        employeeId: `NEU-${String(count + 1).padStart(4, '0')}`,
        name: acc.name,
        email: acc.email,
        department: acc.department,
        designation: acc.designation,
        dateOfJoining: new Date(),
        status: 'active',
        salary: { basic: 40000, hra: 16000, allowances: 8000, deductions: 2000 },
      });
      user.employee = employee._id;
      await user.save();
    }

    console.log(`[SEED] Created ${acc.role} user: ${acc.email} / ${acc.password}`);
  }

  const holidays = [
    { name: 'Republic Day', date: '2026-01-26', type: 'public' },
    { name: 'Independence Day', date: '2026-08-15', type: 'public' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'public' },
    { name: 'Diwali', date: '2026-11-08', type: 'public' },
    { name: 'Christmas', date: '2026-12-25', type: 'public' },
    { name: 'Company Foundation Day', date: '2026-09-15', type: 'company' },
  ];

  for (const h of holidays) {
    const exists = await Holiday.findOne({ date: h.date, name: h.name });
    if (!exists) {
      await Holiday.create(h);
      console.log(`[SEED] Added holiday: ${h.name} (${h.date})`);
    }
  }

  console.log('\n[SEED] Done. Test login accounts:');
  console.log('  Admin:    admin@neuzenai.com / Admin@123');
  console.log('  HR:       hr@neuzenai.com / Hr@12345');
  console.log('  Employee: employee@neuzenai.com / Employee@123');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});
