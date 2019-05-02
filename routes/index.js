var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
var csrf = require('csurf');
var con = require('../config/config');
var csrfProtection = csrf();
router.use(csrfProtection);
var user = {}
    /* GET home page. */
router.get('/', function(req, res) {
    res.render('site/index');
});

// route for logout
router.get('/logout', isLoggedIn, (req, res) => {
        req.logout()
        req.session.destroy((err, done) => {
            if (err) {
                console.log(err)
            } else {
                res.redirect('/login')
                return
            }
        });
    })
    // Login page
router.get('/login', (req, res) => {
    var messages = req.flash('error');
    var success = req.flash('success')
    res.render('site/login', {
        _csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0,
        success: success
    })
});

// Registeration page
router.get('/register', (req, res) => {
    var messages = req.flash('error');
    var success = req.flash('success')
    res.render('site/register', {
        _csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0,
        success: success
    })
});

// Login route
router.post('/login', async(req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    // Validation Error
    if (email === "" || typeof email === 'undefined') {
        req.flash('error', 'Email is empty')
        res.redirect('/login');
        return
    }
    //checking the password field if its empty or undefined
    if (password === "" || typeof password === 'undefined') {
        req.flash('error', 'Password is empty')
        res.redirect('/login');
        return;
    }
    //calling the select function to check the database if the user exist
    let loginUser = await user._checkUser(email);
    if (loginUser.hasOwnProperty('error')) {
        console.log(loginUser.error)
        return
    } else {
        // Check for existing user
        if (!loginUser.length) {
            req.flash('error', 'Incorrect username or password')
            res.redirect('/login')
            return
        }
        // Get existing user password
        let pwd = loginUser[0].password;

        // Compare incoming and existing password together to know if the password is valid or not
        if (!validPassword(password, pwd)) {
            req.flash('error', 'Incorrect password')
            res.redirect('/login')
        } else {
            req.session.user = loginUser;
            req.session.save((err) => {
                if (err) {
                    console.log(err)
                } else {
                    res.redirect('/user/dashboard')
                }
            })

        }
    }
})

// Handling registering new sender
router.post('/register', async(req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let password = req.body.password;
    let cpassword = req.body.cpassword;
    let phone = req.body.phone;
    let role = req.body.role;
    //regex email pattern to validate the email
    var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/igm;

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
    // Confirm passwod empty field
    if (cpassword === "" || typeof cpassword === 'undefined') {
        req.flash('error', 'Please confirm your password')
        res.redirect('/register')
        return
    }
    // Compare both password
    if (cpassword !== password) {
        req.flash('error', 'Password  do not match')
        res.redirect('/register')
        return
    }

    if (phone === "" || typeof phone === 'undefined') {
        req.flash('error', 'Please tyoe your phone number')
        res.redirect('/register')
        return
    }

    if (role === "" || typeof role === 'undefined') {
        req.flash('error', 'Please select a role')
        res.redirect('/register')
        return
    }
    //function to check if the user already exist in the database
    let checkInfo = await user._checkUser(email);
    if (checkInfo.hasOwnProperty('error')) {
        console.log(checkInfo.error)
        return
    }
    if (checkInfo.length) {
        req.flash('error', 'This Email already exist')
        res.redirect('/register')
        return
    } else {
        //passing the user submited params into an array 
        let hashPassword = encryptPassword(password)
        let userInfo = [firstname, lastname, email, hashPassword, phone, role];
        //insert function to insert the records into the databse
        let userReg = await user._regUser(userInfo);
        if (userReg.hasOwnProperty('error')) {
            console.log(userReg.error)
            return
        }
        req.flash('success', 'You have successfully registered' + 'Please login to continue')
        res.redirect('/user/dashboard')
    }
});

// Force user to login
function isLoggedIn(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/login');
}

// Encrypt password
function encryptPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
}

function validPassword(password, pwd) {
    return bcrypt.compareSync(password, pwd)
}

// to check if the username match the details in the database 
user._checkUser = (email) => {
    return new Promise((resolved) => {
        try {
            con.realConnect.query('SELECT * FROM `users` WHERE `email` = ?', email, (error, result) => {
                resolved(error ? { "error": error } : resolved(result))
            })
        } catch (error) {
            resolved({ "error": error })
            console.log(error)
            return
        }
    })
}

// Register new sender
user._regUser = (userInfo) => {
    return new Promise(resolved => {
        try {
            con.realConnect.query('INSERT INTO `users` (`firstname`, `lastname`, `email`, `password`, `phone`, `role`) VALUES(?, ?, ?, ?, ?, ?)', userInfo, (err, result) => {
                resolved(err ? { 'error': err } : resolved(result))
            })
        } catch (error) {
            resolved({ "error": error })
            console.log(error)
            return
        }
    })
}

module.exports = router;