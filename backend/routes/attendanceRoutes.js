const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAttendanceRecords,
  markAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/check-in', authorize('employee', 'hr', 'admin'), checkIn);
router.post('/check-out', authorize('employee', 'hr', 'admin'), checkOut);
router.get('/me', getMyAttendance);
router.get('/', authorize('admin', 'hr'), getAttendanceRecords);
router.post('/mark', authorize('admin', 'hr'), markAttendance);

module.exports = router;
