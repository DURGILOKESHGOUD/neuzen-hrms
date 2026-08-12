const asyncHandler = require('express-async-handler');
const OfferLetter = require('../models/OfferLetter');
const Employee = require('../models/Employee');
const User = require('../models/User');

const buildLetterBody = ({ candidateName, designation, department, ctc, joiningDate }) => {
  const formattedDate = new Date(joiningDate).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return `Dear ${candidateName},

We are pleased to offer you the position of ${designation} in the ${department} department at NEUZEN AI.

Your annual Cost to Company (CTC) will be INR ${Number(ctc).toLocaleString('en-IN')}.
Your date of joining will be ${formattedDate}.

This offer is subject to the terms and conditions of NEUZEN AI's employment policy. Please confirm your acceptance by replying to this letter.

We look forward to welcoming you to the team.

Warm regards,
HR Team
NEUZEN AI`;
};

// @desc  Create a structured offer letter (HR triggers onboarding)
// @route POST /api/onboarding/offer-letters
const createOfferLetter = asyncHandler(async (req, res) => {
  const { candidateName, candidateEmail, designation, department, ctc, joiningDate } = req.body;
  if (!candidateName || !candidateEmail || !designation || !department || !ctc || !joiningDate) {
    res.status(400);
    throw new Error('All offer letter fields are required');
  }

  const letterBody = buildLetterBody({ candidateName, designation, department, ctc, joiningDate });

  const offer = await OfferLetter.create({
    candidateName,
    candidateEmail: candidateEmail.toLowerCase(),
    designation,
    department,
    ctc,
    joiningDate,
    letterBody,
    issuedBy: req.user._id,
    status: 'sent',
  });

  res.status(201).json({ success: true, message: 'Offer letter generated', data: offer });
});

// @desc  List offer letters
// @route GET /api/onboarding/offer-letters
const getOfferLetters = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;
  const offers = await OfferLetter.find(query).sort({ createdAt: -1 }).populate('issuedBy', 'name email');
  res.json({ success: true, data: offers });
});

// @desc  Get single offer letter
// @route GET /api/onboarding/offer-letters/:id
const getOfferLetter = asyncHandler(async (req, res) => {
  const offer = await OfferLetter.findById(req.params.id).populate('issuedBy', 'name email');
  if (!offer) {
    res.status(404);
    throw new Error('Offer letter not found');
  }
  res.json({ success: true, data: offer });
});

// @desc  Update offer letter status (accept/reject)
// @route PUT /api/onboarding/offer-letters/:id/status
const updateOfferStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['sent', 'accepted', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('status must be one of: sent, accepted, rejected');
  }
  const offer = await OfferLetter.findById(req.params.id);
  if (!offer) {
    res.status(404);
    throw new Error('Offer letter not found');
  }
  offer.status = status;
  await offer.save();
  res.json({ success: true, message: 'Offer letter status updated', data: offer });
});

// @desc  Complete onboarding: convert an accepted offer letter into an active Employee + User
// @route POST /api/onboarding/offer-letters/:id/onboard
const completeOnboarding = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const offer = await OfferLetter.findById(req.params.id);
  if (!offer) {
    res.status(404);
    throw new Error('Offer letter not found');
  }
  if (offer.status === 'onboarded') {
    res.status(400);
    throw new Error('This candidate has already been onboarded');
  }
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('A temporary password (min 6 chars) is required to create the employee login');
  }

  const existingUser = await User.findOne({ email: offer.candidateEmail });
  if (existingUser) {
    res.status(400);
    throw new Error('A user account already exists for this email');
  }

  const user = await User.create({
    name: offer.candidateName,
    email: offer.candidateEmail,
    password,
    role: 'employee',
  });

  const count = await Employee.countDocuments();
  const employee = await Employee.create({
    user: user._id,
    employeeId: `NEU-${String(count + 1).padStart(4, '0')}`,
    name: offer.candidateName,
    email: offer.candidateEmail,
    department: offer.department,
    designation: offer.designation,
    dateOfJoining: offer.joiningDate,
    status: 'onboarding',
    salary: { basic: Math.round(offer.ctc / 12 * 0.5), hra: Math.round(offer.ctc / 12 * 0.2), allowances: Math.round(offer.ctc / 12 * 0.3), deductions: 0 },
  });

  user.employee = employee._id;
  await user.save();

  offer.status = 'onboarded';
  offer.linkedEmployee = employee._id;
  await offer.save();

  res.status(201).json({
    success: true,
    message: 'Candidate onboarded successfully',
    data: { employee, offer },
  });
});

module.exports = {
  createOfferLetter,
  getOfferLetters,
  getOfferLetter,
  updateOfferStatus,
  completeOnboarding,
};
