const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    basic: { type: Number, required: true },
    hra: { type: Number, required: true },
    allowances: { type: Number, required: true },
    deductions: { type: Number, required: true },
    lopDays: { type: Number, default: 0 }, // loss of pay days (unpaid leave / absent)
    lopAmount: { type: Number, default: 0 },
    grossPay: { type: Number, required: true },
    netPay: { type: Number, required: true },
    status: {
      type: String,
      enum: ['generated', 'paid'],
      default: 'generated',
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paidOn: { type: Date },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
