const Staff = require('../models/staff');
const User = require('../models/users');
const Admin = require('../models/auth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const {
    validationResult
} = require('express-validator');
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));
exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        pagetitle: 'Login',
        path: '/login',
        errorMessage: null,
        validationCSS: [],
        oldValue: {
            email: '',
            password: ''
        }
    })
}
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pagetitle: 'Login',
            path: 'Login',
            errorMessage: errors.array(0).msg,
            validationCSS: errors.array(),
            oldValue: {
                email: email,
                password: ''
            }
        })
    }
    User.findOne({
            email: email
        })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pagetitle: 'Login',
                    path: 'Login',
                    errorMessage: 'Invalid Email or Password',
                    validationCSS: errors.array(),
                    oldValue: {
                        email: email,
                        password: ''
                    }
                })
            }
            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        return res.status(422).render('auth/login', {
                            pagetitle: 'Login',
                            path: 'Login',
                            errorMessage: 'Invalid Email or Password',
                            validationCSS: [],
                            oldValue: {
                                email: email,
                                password: ''
                            }
                        })
                    }
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    req.session.save(err => {
                        return res.redirect('/');
                    })
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}
exports.getSignUp = (req, res, next) => {
    const token = req.params.token;
    const errors = validationResult(req);
    Staff.findOne({
            staffToken: token
        })
        .then(preRegisteredUser => {
            if (!preRegisteredUser) {
                return next(new Error('Invalid token'));
            }
            if (preRegisteredUser.status) {
                return res.status(422).render('auth/login', {
                    pagetitle: 'Login',
                    path: 'Login',
                    errorMessage: 'Already used token!',
                    validationCSS: [],
                    oldValue: {
                        email: '',
                        password: ''
                    }
                })
            }
            res.render('auth/signup', {
                pagetitle: 'Registration',
                path: '/user/register',
                token: token,
                errorMessage: null,
                validationCSS: [],
                oldValue: {
                    name: '',
                    email: '',
                    password: '',
                    confirmpassword: ''
                }
            })
        })
        .catch(err => {
            // console.log(err);
            return next(new Error(err));
        })
}

exports.postSignUp = (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;
    const token = req.body.reset;
    const errors = validationResult(req);

    
    Staff.findOne({
            email: email,
            token: token
        })
        .then(preRegisteredUser => {
            if (!preRegisteredUser) {
                return res.status(422).render('auth/login', {
                    pagetitle: 'Login',
                    path: 'Login',
                    errorMessage: 'Invalid token or email!',
                    validationCSS: [],
                    oldValue: {
                        email: '',
                        password: ''
                    }
                });
            }
            return User.findOne({
                    email: email
                })
                .then(user => {
                    if (user) {
                        return res.status(422).render('auth/login', {
                            pagetitle: 'Login',
                            path: 'Login',
                            errorMessage: 'User exist, please login!',
                            validationCSS: [],
                            oldValue: {
                                email: '',
                                password: ''
                            }
                        })
                    }
                    return bcrypt.hash(password, 12)
                        .then(hashedPassword => {
                            const newUser = new User({
                                name: name,
                                email: email,
                                password: hashedPassword,
                                is_active: 1
                            });
                            return newUser.save()
                                .then(preRegisteredUserAccount => {
                                    preRegisteredUser.status = true;
                                    return preRegisteredUser.save();
                                })
                                .catch(err => {
                                    const error = new Error(err);
                                    error.httpStatusCode = 500;
                                    return next(error);
                                })
                        })
                        .catch(err => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        })

                })
                .then(result => {
                    res.status(200).render('auth/login', {
                        pagetitle: 'Login',
                        path: 'Login',
                        errorMessage: 'Registration Successful! Please login',
                        validationCSS: [],
                        oldValue: {
                            email: email,
                            password: password
                        }
                    })
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}
exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);

        }
        return res.redirect('/login');
    })
}
exports.getPasswordReset = (req, res, next) => {
    res.render('auth/reset', {
        pagetitle: 'Password Reset',
        path: '/user/reset',
        errorMessage: null,
        validationCSS: [],
        oldValue: {
            email: '',

        }
    })
}
exports.postPasswordReset = (req, res, next) => {
    const email = req.body.email;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/reset', {
            pagetitle: 'Reset',
            path: '/user/reset',
            errorMessage: errors.array(0).msg,
            validationCSS: errors.array(),
            oldValue: {
                email: email,
            }
        })
    }

    crypto.randomBytes(32, (err, Buffer) => {
        if (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
        const token = Buffer.toString('hex');
        User.findOne({
                email: email
            })
            .then(user => {
                if (!user) {
                    return res.status(422).render('auth/login', {
                        pagetitle: 'Login',
                        path: '/login',
                        errorMessage: 'Email does not exist!',
                        validationCSS: [],
                        oldValue: {
                            email: '',
                            password: ''
                        }
                    })
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();

            })
            .then(reset => {
                res.status(200).render('auth/login', {
                    pagetitle: 'Login',
                    path: '/login',
                    errorMessage: 'Check your mail to reset your password',
                    validationCSS: [],
                    oldValue: {
                        email: '',
                        password: ''
                    }
                })
                return transporter.sendMail({
                    to: email,
                    from: 'lasu@edu.ng',
                    subject: 'LAMS RESET PASSWORD LINK',
                    html: `
                            <h3>Reset your Password!</h3>

                            <p>Do not share this link with anyone.<br> Click on this <a href='http://localhost:4000/user/reset/${token}'>link</a> to reset your password</p>
                        `
                })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            })

    })
}
exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pagetitle: 'Login',
                    path: '/login',
                    errorMessage: 'Token expired!',
                    validationCSS: [],
                    oldValue: {
                        email: '',
                        password: ''
                    }
                })
            }
            res.render('auth/newpassword.ejs', {
                pagetitle: 'Reset password',
                path: '/user/reset',
                token: token,
                userId: user._id
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}
exports.postNewPassword = (req, res, next) => {
    const token = req.body.token;
    const userId = req.body.userId;
    const password = req.body.password;
    let email;
    User.findOne({
            _id: userId,
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pagetitle: 'Login',
                    path: '/login',
                    errorMessage: 'Token expired!',
                    validationCSS: [],
                    oldValue: {
                        email: '',
                        password: ''
                    }
                })
            }
            email = user.email;
            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    user.password = hashedPassword;
                    user.resetToken = undefined;
                    user.resetTokenExpiration = undefined;
                    return user.save();
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                })
        })
        .then(result => {
            res.status(200).render('auth/login', {
                pagetitle: 'Login',
                path: '/login',
                errorMessage: 'Reset successful. Please login.',
                validationCSS: [],
                oldValue: {
                    email: '',
                    password: ''
                }
            })
            return transporter.sendMail({
                to: email,
                from: 'lasu@edu.ng',
                subject: 'LAMS RESET PASSWORD SUCCESSFUL',
                html: `
                            <h3>Congratution!</h3>

                            <p>You have successfully reset your password.<br>Click on this <a href='http://localhost:4000/login'>link</a> to login</p>
                        `

            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}


// Admin Authentication starts

exports.getAdminLogin = (req, res, next) => {
    res.render('auth/auth-login', {
        pagetitle: 'Restricted || Login',
        path: '/admin/login',
        errorMessage: null,
        validationCSS: [],
        oldValue: {
            email: '',
            password: ''
        }
    })
}
exports.postAdminLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    Admin.findOne({
            email: email
        })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/auth-login', {
                    pagetitle: 'Admin Login',
                    path: '/admin/login',
                    errorMessage: 'Access Denied',
                    validationCSS: [],
                    oldValue: {
                        email: email,
                        password: ''
                    }
                })
            }
            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        return res.status(422).render('auth/auth-login', {
                            pagetitle: 'Admin Login',
                            path: '/admin/login',
                            errorMessage: 'Access Denied',
                            validationCSS: [],
                            oldValue: {
                                email: email,
                                password: ''
                            }
                        })
                    }
                    req.session.isAdminLoggedIn = true;
                    req.session.save(err => {
                        return res.redirect('/admin');
                    })
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}
exports.postAdminLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            return next(new Error('Error occured'));
        }
        res.redirect('/admin/login');
    })
}