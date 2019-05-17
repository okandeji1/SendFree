var express = require('express');
var router = express.Router();
var con = require('../../config/config');

admin = {}
    // dashboard
router.get('/admin-us', isLoggedIn, async(req, res) => {
    // Fetch all users
    let selectUsers = await admin._fetchUsers();
    if (selectUsers.error) {
        console.log(selectUsers.error)
    }
    res.render('admin/admin_user', { layout: 'layouts/admin', allUsers: selectUsers })
});


module.exports = router;
// Force user to login
function isLoggedIn(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/login');
}

// Fetch all users query
admin._fetchUsers = () => {
    return new Promise(resolved => {
        try {
            con.realConnect.query('SELECT * FROM `users`', (err, rows) => {
                resolved(err ? { 'error': err } : rows)
            })
        } catch (error) {
            resolved(error)
        }
    })
}