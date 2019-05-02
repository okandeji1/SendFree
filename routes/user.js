var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var con = require('../config/config');
var csrfProtection = csrf();
router.use(csrfProtection);

// dashboard
router.get('/dashboard', isLoggedIn, (req, res) => {
    let user = req.session.user;
    res.render('user/dashboard', { layout: 'layouts/admin', user })
});


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