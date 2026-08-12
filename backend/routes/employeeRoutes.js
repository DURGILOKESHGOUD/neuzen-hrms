const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  changeUserRole,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'hr'), getEmployees);
router.post('/', authorize('admin', 'hr'), createEmployee);
router.get('/:id', getEmployee); // self-check enforced in controller
router.put('/:id', authorize('admin', 'hr'), updateEmployee);
router.delete('/:id', authorize('admin'), deleteEmployee);
router.put('/:id/role', authorize('admin'), changeUserRole);

module.exports = router;
