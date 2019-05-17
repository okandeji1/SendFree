var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var con = require('../config/config');
var csrfProtection = csrf();
var formidable = require('formidable')
router.use(csrfProtection);

user = {}
    // dashboard
router.get('/dashboard', isLoggedIn, (req, res) => {
    let user = req.session.user;
    res.render('user/dashboard', { layout: 'layouts/admin', user })
});

// profile
router.get('/profile', isLoggedIn, (req, res) => {
    let success = req.flash('success')[0]
    let user = req.session.user;
    let messages = req.flash('error')
    res.render('user/profile', {
        layout: 'layouts/admin',
        user,
        _csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0,
        success
    })
});

// Update User Profile
router.post('/profile', isLoggedIn, (req, res, done) => {
    let form = new formidable.IncomingForm();
    form.uploadDir = './public/uploads/users';
    form.keepExtensions = true;
    form.maxFieldsSize = 10 * 1024 * 1024; //10mb
    form.parse(req, async(err, fields, files) => {
        let image = files.image.path;

        if (image === '' || typeof image === 'undefined') {
            req.flash('error', 'Please upload your photo')
            res.redirect('/user/profile')
        }
        // Directory to save image
        // split into an arsay and remove the first index of image path
        let imagePath = image.split('/').pop()
        let userId = req.session.user[0].id
        let userData = [imagePath, userId]
        let newUpdate = await user._updateData(userData);
        if (newUpdate.hasOwnProperty('error')) {
            console.log(newUpdate.error)
            return
        }
        req.flash('success', 'You have successfully updated your profile')
        res.redirect('/user/profile')
    });

})

// route for logout
router.get('/logout', isLoggedIn, (req, res) => {
    req.logout()
    req.session.destroy((err, done) => {
        if (err) {
            console.log(err)
        } else {
            req.flash('success', 'You have successfully logged out')
            res.redirect('/login')
            return
        }
    });
})
router.use('/', isNotLoggedIn, (req, res, next) => {
    return next()
})

// Force user to login
function isLoggedIn(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/login');
}

function isNotLoggedIn(req, res, next) {
    if (!req.session.user && !req.cookies.user_sid) {
        return next()
    }
    res.redirect('/login')
}

module.exports = router;

// Update user profile query
user._updateData = (userData) => {
    return new Promise(resolved => {
        try {
            con.realConnect.query('UPDATE `users` SET `photo` = ? WHERE `id` = ?', userData, (err, rows) => {
                resolved(err ? { 'error': err } : resolved(rows))
            })
        } catch (error) {
            resolved(error)
        }
    })
}