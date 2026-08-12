const express = require('express');
const router = express.Router();
const {
  generatePayroll,
  generateBulkPayroll,
  getMyPayroll,
  getAllPayroll,
  getPayslip,
  markPaid,
} = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/generate', authorize('admin', 'hr'), generatePayroll);
router.post('/generate-bulk', authorize('admin', 'hr'), generateBulkPayroll);
router.get('/me', getMyPayroll);
router.get('/', authorize('admin', 'hr'), getAllPayroll);
router.get('/:id', getPayslip);
router.put('/:id/mark-paid', authorize('admin', 'hr'), markPaid);

module.exports = router;
