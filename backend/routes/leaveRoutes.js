const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, getAllLeaves, reviewLeave, cancelLeave } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('employee', 'hr', 'admin'), applyLeave);
router.get('/me', getMyLeaves);
router.get('/', authorize('admin', 'hr'), getAllLeaves);
router.put('/:id/review', authorize('admin', 'hr'), reviewLeave);
router.put('/:id/cancel', cancelLeave);

module.exports = router;
