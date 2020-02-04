const Request = require('../models/request');
const User = require('../models/users');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Staff = require('../models/staff');
const Admin = require('../models/auth');
const fileUnlink = require('../util/file');
const bcrypt = require('bcryptjs');
const {
    validationResult
} = require('express-validator');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));
exports.getIndex = (req, res, next) => {
    Request.find()
        .populate('userId')
        .then(request => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('admin/index', {
                pagetitle: 'LAMS | Admin',
                path: '/admin',
                requests: request,
                errorMessage: message

            });
        })
        .catch(err => {
            console.log(err);
        })
}
exports.postLeaveUpdate = (req, res, next) => {
    const leaveId = req.body.leaveId;
    const status = req.body.status;
    Request.findOne({
            _id: leaveId
        })
        .then(request => {
            if (!request) {
                return next(new Error('Unable to find request'));

            }
            if (request.withdraw) {
                req.flash('error', 'User already applied for a withdrawal');
                return res.redirect('/admin');
            }
            request.approval = status;
            return request.save();

        })
        .then(result => {
            res.redirect('/admin');
        })
        .catch(err => {

        })
}
exports.postUserStaff = (req, res, next) => {
    const email = req.body.email;

    crypto.randomBytes(32, (err, Buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/admin');
        }
        const token = Buffer.toString('hex');
        User.findOne({
                email: email
            })
            .then(user => {
                if (user) {
                    req.flash('error', 'Account already exist');
                    return res.redirect('/admin');
                }
                return Staff.findOne({
                        email: email
                    })
                    .then(staff => {
                        if (staff) {
                            req.flash('error', 'Error! Staff email has been initiated');
                            return res.redirect('/admin');
                        }
                        const newUser = new Staff({
                            email: email,
                            staffToken: token
                        });
                        return newUser.save();
                    })
            })
            .then(result => {
                req.flash('error', 'Successful. Account has been initiated.');
                res.redirect('/admin')
                return transporter.sendMail({
                    to: email,
                    from: 'lasu@edu.ng',
                    subject: 'Leave Application Registration',
                    html: `
                            <h3>Congratulation!</h3>

                            <p>Your account has been initiated.
                             Do not share this link with anyone.<br>
                              Click on this 
                              <a href='http://localhost:4000/user/register/${token}'>link</a> 
                              to complete your registration</p>
                        `
                })
            })
            .catch(err => {
                console.log(err);
            })

    })
}
exports.getUsers = (req, res, next) => {
    User.find()
        .then(users => {
            let message = req.flash('error');
            if(message.length > 0){
                message = message[0];
            }else{
                message = null;
            }
            res.render('admin/users', {
                pagetitle: 'LAMS | Users',
                path: '/admin/users',
                errorMessage : message,
                users: users
            })
        })
        .catch(err => {
            console.log(err);
        })

}
exports.postDeleteLeave = (req, res, next) => {
    const requestId = req.body.leaveId;
    Request.findOne({
            _id: requestId,
            userId: req.user._id,
            withdraw: 1
        })
        .then(request => {
            fileUnlink.deleteFile(request.attachment);
            return Request.findOneAndRemove({
                    _id: requestId,
                    userId: req.user._id,
                    withdraw: 1
                })
                .then(request => {
                    if (!request) {
                        return next(new Error('An occured error'));
                    }
                    res.redirect('/admin');
                    return transporter.sendMail({
                        to: req.user.email,
                        from: 'lasu@edu.ng',
                        subject: 'Leave Application Removal',
                        html: `
                            <h3>Congratulation!</h3>
                            <p>Your leave application have been withdrawn successfully.</p>
                        `
                    })
                })
                .catch(err => {
                    console.log(err);
                })
        })
        .catch(err => {
            console.log(err);
        })
}
exports.postStaffStatus = (req, res, next) => {
    const is_active = req.body.is_active;
    const userId = req.body.userId;
    User.findOne({
            _id: userId
        })
        .then(user => {
            if (!user) {
                return next(new Error('An error occured'));
            }
            user.is_active = is_active;
            return user.save();
        })
        .then(() => {
            req.flash('error', 'Account setting changed!');
            res.redirect('/admin/users');
        })
        .catch(err => {
            console.log(err);
        })
}
exports.getProfile = (req, res, next) => {
    res.render('admin/profile', {
        pagetitle: 'Admin Profile',
        path: '/admin/profile',
        errorMessage: null,
        oldValue: {
            password: '',
            newpassword: '',
            confirmpassword: ''
        }
    })
}
exports.postProfile = (req, res, next) => {
    const password = req.body.password;
    const newpassword = req.body.newpassword;
    const confirmpassword = req.body.confirmpassword;
    Admin.findOne()
        .then(user => {
            if (!user) {
                return next(new Error('An error occured'));
            }
            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        return res.status(422).render('admin/profile', {
                            pagetitle: 'Admin | Profile',
                            path: '/admin/profile',
                            errorMessage: 'Password does not match',
                            oldValue: {
                                password: '',
                                newpassword: '',
                                confirmpassword: ''
                            }
                        });
                    }
                    return bcrypt.hash(newpassword, 12)
                        .then(hashedPassword => {
                            user.password = hashedPassword;
                            return user.save();
                        })
                        .then(() => {
                            return res.status(400).render('admin/profile', {
                                pagetitle: 'Admin | Profile',
                                path: '/admin/profile',
                                errorMessage: 'Successful',
                                oldValue: {
                                    password: '',
                                    newpassword: '',
                                    confirmpassword: ''
                                }
                            });
                        })
                        .catch(err => {
                            console.log(err);
                        })
                })
                .catch(err => {
                    console.log(err);
                })

        })
        .catch(err => {
            console.log(err);
        })
}