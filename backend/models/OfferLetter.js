const mongoose = require('mongoose');

const offerLetterSchema = new mongoose.Schema(
  {
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, trim: true, lowercase: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    ctc: { type: Number, required: true },
    joiningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'onboarded'],
      default: 'draft',
    },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    letterBody: { type: String, required: true }, // generated structured offer letter text/HTML
    linkedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OfferLetter', offerLetterSchema);
