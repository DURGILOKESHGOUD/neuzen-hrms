const express = require('express');
const router = express.Router();
const {
  createOfferLetter,
  getOfferLetters,
  getOfferLetter,
  updateOfferStatus,
  completeOnboarding,
} = require('../controllers/onboardingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'hr'));

router.post('/offer-letters', createOfferLetter);
router.get('/offer-letters', getOfferLetters);
router.get('/offer-letters/:id', getOfferLetter);
router.put('/offer-letters/:id/status', updateOfferStatus);
router.post('/offer-letters/:id/onboard', completeOnboarding);

module.exports = router;
