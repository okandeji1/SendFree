// Request page
var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var con = require('../config/config');
var csrfProtection = csrf();
router.use(csrfProtection);
const user = {}
    // Make request page
router.get('/', isLoggedIn, (req, res) => {
    var messages = req.flash('error');
    var success = req.flash('success')
    res.render('request/request', {
        layout: 'layouts/admin',
        _csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0,
        success: success,
    })
});

// Get all request that is being made page
router.get('/all-request', isLoggedIn, async(req, res) => {
    let madeRequest = await getRequest();
    if (madeRequest.error) {
        console.log(madeRequest.error)
    }
    let reqChunks = []
    let chunkSize = 1;
    for (let i = 0; i < madeRequest.length; i += chunkSize) {
        reqChunks.push(madeRequest.slice(i, i + chunkSize))
    }
    res.render('request/list_request', { layout: 'layouts/admin', requests: reqChunks });
});

// Get Sender Details
router.get('/details/:id', isLoggedIn, async(req, res) => {
    let id = req.params.id
    let requestDetails = await user._getRequestDetails(id);
    if (requestDetails.error) {
        console.log(requestDetails)
        return
    } else {
        res.render('request/request_details', { layout: 'layouts/admin', requestDetails })
    }
})

// Make request
router.post('/', isLoggedIn, async(req, res) => {
    let location = req.body.location;
    let destination = req.body.destination;
    // Checking for validation
    if (location === "" || typeof location === 'undefined') {
        req.flash('error', 'Location is required')
        res.redirect('/request');
        return
    }
    //checking the destination field if its empty or undefined
    if (destination === "" || typeof destination === 'undefined') {
        req.flash('error', 'Destination is required')
        res.redirect('/request');
        return;
    }
    let userId = req.session.user[0].id;
    // DB query
    let requestInfo = [location, destination, userId]
    let sendRequest = await user._makeRequest(requestInfo);
    if (sendRequest.error) {
        console.log(sendRequest.error);
        return
    } else {
        req.flash('success', 'You have made a request');
        res.redirect('/request')
        return
    }

})

// Receiver response
router.post('/request-status', isLoggedIn, async(req, res) => {
    let requestId = req.body.id;
    let userId = req.session.user[0].id;
    console.log(req.body);
    return
    let responseInfo = [userId, requestId, status]
})

// Make request query
user._makeRequest = (requestInfo) => {
    return new Promise(resolved => {
        try {
            con.realConnect.query('INSERT INTO `requests` (`pickup_location`, `destination`, `user_id`) VALUES(?, ?, ?)', requestInfo, (err, result) => {
                resolved(err ? { 'error': err } : resolved(result))
            })
        } catch (error) {
            resolved({ "error": error })
            console.log(error)
            return
        }
    })
}

// Get all request
function getRequest() {
    return new Promise(resolved => {
        try {
            con.realConnect.query('SELECT * FROM `requests`', (err, rows) => {
                resolved(err ? { 'error': err } : resolved(rows))
            })
        } catch (error) {
            resolved({ "error": error })
            console.log(error)
            return
        }
    })
}

// requset Details
user._getRequestDetails = (id) => {
    return new Promise(resolved => {
        try {
            con.realConnect.query('SELECT * FROM `requests` WHERE `id` = ?', id, (err, rows) => {
                resolved(err ? { 'error': err } : resolved(rows))
            })
        } catch (error) {
            resolved({ "error": error })
            console.log(error)
            return
        }
    })
}

user._receverResponse = (responseInfo) => {
        return new Promise(resolved => {
            try {
                con.realConnect.query('INSERT INTO `request_statuses` (`user_id`, `request_id`, `is_accepted`) VALUES(?, ?, ?)', responseInfo, (err, rows) => {
                    resolved(err ? { 'error': err } : resolved(rows))
                })
            } catch (error) {
                resolved({ "error": error })
                console.log(error)
                return
            }
        })
    }
    // Force user to login
function isLoggedIn(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/login');
}

module.exports = router;