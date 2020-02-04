const express =  require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { body, check } = require('express-validator');
const Staff = require('../models/staff');
const User = require('../models/users');
const Admin = require('../models/auth');

// Staff Authentication Router
router.get('/login', authController.getLogin);
router.get('/user/register/:token', authController.getSignUp);
router.post('/user/register', [
    body('name')
    .isAlpha()
    .withMessage('Name must be Alphabelt!')
    .isLength({min : 5})
    .withMessage('Length must be greater than 5'),
    check('email')
    .normalizeEmail()
    .trim(),
    body('password', 'Password length must be more than 8')
    .trim()
    .isLength({min : 8}),
    body('confirmpassword')
    .custom((value, {req}) => {
        if(value !== req.body.password) {
            throw new Error('Password does not match');
        }
        return true;
    })
    
], authController.postSignUp);
router.post('/login', [
    check('email')
    .normalizeEmail()
    .trim(),
    body('password')
    .trim()
    .isLength({ min : 8 })
    .withMessage('Password length must be more than 8')
], authController.postLogin);
router.post('/logout', authController.postLogout);
router.get('/user/reset', authController.getPasswordReset);
router.post('/user/reset',  authController.postPasswordReset);
router.get('/user/reset/:token', authController.getNewPassword);
router.post('/user/reset/new-password', [
    body('password', 'Password length must be more than 8')
    .trim()
    .isLength({min : 8}),
    body('confirmpassword')
    .custom((value, {req}) => {
        if(value !== req.body.password) {
            throw new Error('Password does not match');
        }
        return true;
    })
], authController.postNewPassword);

// Admin Authentication Router

router.get('/admin/login', authController.getAdminLogin);
router.post('/admin/login', [
    check('email')
    .normalizeEmail()
    .trim(),
    body('password')
    .trim()
    .isLength({ min : 8 })
    .withMessage('Password length must be more than 8')
], authController.postAdminLogin);
router.post('/admin/logout', authController.postAdminLogout);

module.exports = router;