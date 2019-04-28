var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
var csrf = require('csurf');
var con = require('../config/config');
var csrfProtection = csrf();
router.use(csrfProtection);
const user = {}

// dashboard
router.get('/dashboard', isLoggedIn, (req, res) => {
    res.render('user/sender/dashboard', { layout: 'layouts/admin' })
});

// Request page
router.get('/request', isLoggedIn, (req, res) => {
    var messages = req.flash('error');
    var success = req.flash('success')
    res.render('user/sender/request', {
        _csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0,
        success: success,
        hasSuccess: success.length > 0
    })
});

// Make request
router.post('/request', (req, res) => {
    let location = req.body.location;
    let destination = req.body.destination;
    // Checking for validation
    if (location === "" || typeof location === 'undefined') {
        req.flash('error', 'Location is required')
        res.redirect('/sender/request');
        return
    }
    //checking the destination field if its empty or undefined
    if (destination === "" || typeof destination === 'undefined') {
        req.flash('error', 'Destination is required')
        res.redirect('/sender/request');
        return;
    }
    // DB query
    let requestInfo = [location, destination]
    let sendRequest = await user._makeRequest(requestInfo);
    if (sendRequest.error) {
        console.log(requestInfo.error);
        return
    } else {
        req.flash('success', 'You have made a request');
        res.redirect('/sender/request')
        return
    }

})

// route for logout
router.get('/logout', isLoggedIn, (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        req.logout()
        req.session.destroy((err, done) => {
            if (err) {
                console.log(err)
            } else {
                // req.flash('success', 'You have successfully logged out')
                res.redirect('/sender/login')
                return
            }
        })
    } else {
        res.redirect('/404');
        return
    }
});

// Login page
router.get('/login', (req, res) => {
    var messages = req.flash('error')
    res.render('site/login', {
        _csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0
    })
});

// Registeration page
router.get('/register', (req, res) => {
    var messages = req.flash('error')
    res.render('site/register', {
        _csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0
    })
});

// Login route
router.post('/login', async(req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (req.body === "" || typeof req.body === 'undefined') {
        req.flash('error', 'username is empty')
        res.redirect('/sender/login');
        return
    }
    if (username === "" || typeof username === 'undefined') {
        req.flash('error', 'username is empty')
        res.redirect('/sender/login');
        return
    }
    //checking the password field if its empty or undefined
    if (password === "" || typeof password === 'undefined') {
        req.flash('error', 'Password is empty')
        res.redirect('/sender/login');
        return;
    }
    //calling the select function to check the database if the user exist
    let loginSender = await user._checkSender(username);
    if (loginSender.hasOwnProperty('error')) {
        console.log(loginSender.error)
        return
    } else {
        // if statement to see if the user exist in the database if not return an error
        if (loginSender.length) {
            req.flash('error', 'Incorrect username or password')
            res.redirect('/sender/login')
            return
        }
        //comparing the password the user entered with the password from the database
        let pwd = loginSender[0].password;

        //if the comparism is false give an error else send a success
        if (!validPassword(password, pwd)) {
            req.flash('error', 'Incorrect password')
            res.redirect('/sender/login')
        } else {
            req.session.user = loginSender;
            req.session.save((err) => {
                if (err) {
                    console.log(err)
                } else {
                    res.redirect('/sender/dashboard')
                }
            })

        }
    }
})

// Handling registering new sender
router.post('/register', async(req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let username = req.body.username;
    let password = req.body.password;
    let cpassword = req.body.cpassword;

    //checking if the firstname field is empty or undefined
    if (firstname === "" || typeof firstname === 'undefined') {
        req.flash('error', 'First name is required')
        res.redirect('/register')
        return
    }
    //checking if the lastname field is empty or undefined
    if (lastname === "" || typeof lastname === 'undefined') {
        req.flash('error', 'Last name is required')
        res.redirect('/register')
        return
    }

    //checking if the email field is empty or undefined and if it matches the regex pattern
    if (email === "" || typeof email === 'undefined' || !re.test(email)) {
        req.flash('error', 'Email is required')
        res.redirect('/register');
        return
    }
    //checking if the password field is empty or undefined
    if (password === "" || typeof password === 'undefined') {
        req.flash('error', 'Password is required')
        res.redirect('/register')
        return
    }

    if (cpassword === "" || typeof cpassword === 'undefined') {
        req.flash('error', 'Please confirm your password')
        res.redirect('/register')
        return
    }

    if (cpassword !== password) {
        req.flash('error', 'Password  do not match')
        res.redirect('/register')
        return
    }

    //function to check if the user already exist in the database
    let checkInfo = await user._checkSender(username);
    if (checkInfo.hasOwnProperty('error')) {
        console.log(checkInfo.error)
        return
    }
    if (checkInfo.length) {
        req.flash('error', 'This username already exist')
        res.redirect('/user/signup')
        return
    } else {
        //passing the user submited params into an array 
        let hashPassword = encryptPassword(password)
        let senderInfo = [firstname, lastname, username, hashPassword, phone];
        //insert function to insert the records into the databse
        let senderReg = await user._regSender(senderInfo);
        if (senderReg.hasOwnProperty('error')) {
            console.log(senderReg.error)
            return
        }
        req.flash('You have successfully registered')
        res.redirect('/sender/dashboard')
    }
});


// Encrypt password
function encryptPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
}

function validPassword(password, pwd) {
    return bcrypt.compareSync(password, pwd)
}
// Force user to login
function isLoggedIn(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/sender/login');
}

// to check if the username match the details in the database 
user._checkSender = (username) => {
    return new Promise((resolved) => {
        try {
            con.realConnect.query('SELECT * FROM `senders` WHERE `username` = ?', username, (error, result) => {
                resolved(error ? { "error": error } : { "data": result })
            })
        } catch (error) {
            resolved({ "error": error })
            console.log(error)
            return
        }
    })
}

// Register new sender
user._regSender = (senderInfo) => {
    return new Promise(resolved => {
        try {
            con.realConnect.query('INSERT INTO `senders` VALUES(?, ?, ?, ?, ?)', senderInfo, (err, result) => {
                resolved(err ? { 'error': err } : resloved(result))
            })
        } catch (error) {

        }
    })
}

// Make request query
user._makeRequest = (requestInfo) => {
    return new Promise(resolved => {
        try {
            con.realConnect.query('INSERT INTO `requests` VALUES(?, ?)', requestInfo, (err, result) => {
                resolved(err ? { 'error': err } : resloved(result))
            })
        } catch (error) {

        }
    })
}

module.exports = router;