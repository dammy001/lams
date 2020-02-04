const Request = require('../models/request');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const User = require('../models/users');
const PDFDocument = require('pdfkit');
const {
    validationResult
} = require('express-validator');
exports.getIndex = (req, res, next) => {
    Request.find({
            userId: req.user
        })
        .then(requests => {
            res.render('users/index', {
                pagetitle: 'LAMS',
                page: '/',
                requests: requests,
                errorMessage: null,
                validationCSS: [],
                oldValue: {
                    duration: '',
                    category: '',
                }
            })
        })
        .catch(err => {
            console.log(err);
        })
}
exports.postLeave = (req, res, next) => {
    const duration = req.body.duration;
    const category = req.body.category;
    const document = req.file;

    const errors = validationResult(req);
    // console.log(duration,category,document)

    if (!document) {
        return res.status(422).render('admin/edit-product', {
            pagetitle: 'LAMS',
            page: '/',
            editing: false,
            errorMessage: 'Image needs to be a document..',
            validationCSS: errors.array(),
            oldValue: {
                duration: duration,
                category: category,
            }
        })
    }
    if (!errors.isEmpty()) {
        return res.status(422).render('users/index', {
            pagetitle: 'LAMS',
            page: '/',
            errorMessage: errors.array()[0].msg,
            validationCSS: errors.array(),
            oldValue: {
                duration: duration,
                category: category,
            }
        })
    }

    const request = new Request({
        duration: duration,
        category: category,
        approval: 0,
        userId: req.user,
        attachment: document.path,
        date: moment().format('MMMM Do YYYY, h:mm:ss a')
    });
    request.save()
        .then(() => {
            return res.redirect('/');
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
            approval: 0
        })
        .then(request => {
            if (!request) {
                return next(new Error('Error occured'));
            }
            request.withdraw = 1;
            return request.save();
        })
        .then(() => {
            return res.redirect('/');
        })
        .catch(err => {
            console.log(err);
        })
}

exports.getProfile = (req, res, next) => {
    User.findOne({
            _id: req.user._id
        })
        .then(user => {
            if (!user) {
                return next(new Error('Cant find user'));
            }
            res.render('users/profile', {
                pagetitle: 'Profile',
                path: '/user/profile',
                user: user,
                errorMessage: null
            })
        })
        .catch(err => {
            console.log(err);
        })

}
exports.postProfile = (req, res, next) => {
    const userId = req.body.userId;
    const name = req.body.name;
    const password = req.body.password;
    User.findOne({
            _id: userId
        })
        .then(user => {
            if (!user) {
                return next(new Error('Unable to locate user'));
            }
            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    user.name = name;
                    user.password = hashedPassword;
                    return user.save();

                })
                .catch(err => {
                    console.log(err);
                })
        })
        .then(result => {
            res.render('users/profile', {
                pagetitle: 'Profile',
                path: '/user/profile',
                errorMessage: 'Changed Successful'
            })
        })
        .catch(err => {
            console.log(err);
        })
}
exports.getReport = (req, res, next) => {
    const reportId = req.params.reportId;
    Request.findOne({
            _id: reportId,
            userId: req.user._id
        })
        .populate('userId')
        .then(request => {
            if (!request) {
                return next(new Error('Unable o locate report'));
            }
            const reportName = 'report' + reportId + '.pdf';
            const reportPath = path.join('data', 'reports', reportName);
            const pdfDoc = new PDFDocument();
            res.setHeader('Content-type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="' + reportId + '"');
            pdfDoc.pipe(fs.createWriteStream(reportPath));
            pdfDoc.pipe(res);
            pdfDoc.fontSize(12).text('Restricted', {
                align: 'center'
            });
            pdfDoc.moveDown();
            pdfDoc.fontSize(15).text('Lagos State University', {
                align: 'center'
            });
            pdfDoc.fontSize(15).text('Ojo, Lagos', {
                align: 'center'
            });
            pdfDoc.fontSize(15).text('Nigeria', {
                align: 'center'
            });
            pdfDoc.moveDown();
            pdfDoc.fontSize(14).text('Leave Report', {
                align: 'center'
            });
            pdfDoc.moveDown();
            
            pdfDoc.moveDown();
            if(request.approval == 1){
                pdfDoc.fontSize(14).text(`Dear ${request.userId.name}, your leave request for ${request.duration} day's have been granted`, {
                    align: 'left'
                });
            }
            else{
                pdfDoc.fontSize(14).text(`Dear ${request.userId.name}, your leave request for ${request.duration} day's have been disapproved`, {
                    align: 'left'
                });
            }
            
            pdfDoc.moveDown();
            // pdfDoc.fontSize(14).text(`DATE          :   ${Date.now()}`, {
            //     align: 'left'
            // });
            
            pdfDoc.moveDown();
            pdfDoc.moveDown();
            pdfDoc.moveDown();
            pdfDoc.fontSize(12).text('Restricted', {
                align: 'center',

            });

            pdfDoc.end();
        })
        .catch(err => {
            console.log(err);
        })
}