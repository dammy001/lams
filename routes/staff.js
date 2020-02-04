const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const staffController = require('../controllers/staffs');
const { body } = require('express-validator');

router.get('/', isAuth, staffController.getIndex);
router.post('/leave', [
    body('duration')
    .isNumeric()
    .withMessage('Duration must be in days e.g 16'),
    body('category')
    .isLength({min : 1})
    .withMessage('Please select a leave category'),
    
], isAuth, staffController.postLeave);
router.get('/user/report/:reportId', staffController.getReport);

router.post('/leave/delete', isAuth, staffController.postDeleteLeave);
router.get('/profile', isAuth, staffController.getProfile);
router.post('/profile', isAuth, staffController.postProfile);

module.exports = router;