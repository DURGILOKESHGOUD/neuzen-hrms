const express = require('express');
const router = express.Router();
const { getHolidays, createHoliday, deleteHoliday, getCalendarEvents } = require('../controllers/calendarController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/holidays', getHolidays);
router.post('/holidays', authorize('admin', 'hr'), createHoliday);
router.delete('/holidays/:id', authorize('admin', 'hr'), deleteHoliday);
router.get('/events', getCalendarEvents);

module.exports = router;
