const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const isAdminAuth = require('../middleware/isAdminAuth');
const { check } = require('express-validator');
router.get('/', isAdminAuth, adminController.getIndex);
router.get('/users', isAdminAuth, adminController.getUsers);
router.post('/leave/delete', isAdminAuth, adminController.postDeleteLeave);
router.post('/leave/update', isAdminAuth, adminController.postLeaveUpdate);
router.post('/user/add', [
    check('email')
    .normalizeEmail()
], isAdminAuth, adminController.postUserStaff);
router.post('/user/staff', isAdminAuth, adminController.postUserStaff);
router.post('/user/status/update', isAdminAuth, adminController.postStaffStatus);
router.get('/profile', isAdminAuth, adminController.getProfile);
router.post('/profile', isAdminAuth, adminController.postProfile);


module.exports = router;