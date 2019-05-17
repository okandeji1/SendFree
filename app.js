var express = require('express');
var cors = require('cors')
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var hbs = require('hbs');
var hbsutils = require('hbs-utils');
var con = require('./config/config');
var swal = require('sweetalert')
    // Declaring our routes
var routes = require('./routes/index');
var users = require('./routes/user');
var request = require('./routes/request');
var admin = require('./routes/admin/admin_user');

var app = express();
const blocks = {};
const templateUtil = hbsutils(hbs);
// export locals app to template
hbs.localsAsTemplateData(app);
app.locals.defaultPageTitle = 'Send Free';
// view engine setup
templateUtil.registerPartials(`${__dirname}/views/partials`);
templateUtil.registerWatchedPartials(`${__dirname}/views/partials`);
templateUtil.precompilePartials();
hbs.registerPartials(`${__dirname}/views/partials`);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Enable cors for all platform
app.use(cors())

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 180 * 60 * 1000 }
}));
// Flash Message
app.use(flash());
// This middleware will check if user's cookie is still saved in
//  browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.login = req.session.user;
    next();
});

// Making our routes usable
app.use('/admin', admin);
app.use('/request', request);
app.use('/user', users);
app.use('/', routes);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// helper for select tag option
hbs.registerHelper('select', function(selected, options) {
    return options.fn(this).replace(new RegExp(` value=\"${ selected }\"`),
        '$& selected="selected"').replace(new RegExp(`>${ selected }</option>`),
        'selected="selected"$&');
});


// helper use for comparision and operator

hbs.registerHelper({
    eq: (v1, v2) => {
        return v1 === v2;
    },
    ne: (v1, v2) => {
        return v1 !== v2;
    },
    lt: (v1, v2) => {
        return v1 < v2;
    },
    gt: (v1, v2) => {
        return v1 > v2;
    },
    lte: (v1, v2) => {
        return v1 <= v2;
    },
    gte: (v1, v2) => {
        return v1 >= v2;
    },
    and: (v1, v2) => {
        return v1 && v2;
    },
    or: (v1, v2) => {
        return v1 || v2;
    }

});


// Used to increment index
hbs.registerHelper('inc', function(value, options) {
    return parseInt(value) + 1;
});

hbs.registerHelper('JSON', function(value, options) {
    return new hbs.handlebars.SafeString(JSON.stringify(value));
});


// hbs.registerPartials(`${__dirname}/views/partials`, () => {});
// hbs helpers
hbs.registerHelper('link', function(text, options) {
    var attrs = [];

    for (const prop in options.hash) {
        attrs.push(
            `${hbs.handlebars.escapeExpression(prop)}="` +
            `${hbs.handlebars.escapeExpression(options.hash[prop])}"`);
    }

    return new hbs.handlebars.SafeString(
        `<a ${attrs.join(' ')}>${hbs.handlebars.escapeExpression(text)}</a>`
    );
});

// handlebars hellper for block
hbs.registerHelper('block', function(name) {
    const val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
});

// handlebars helper to extend scripts
hbs.registerHelper('extend', function(name, context) {
    let block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context.fn(this));
    // for older versions of handlebars, use block.push(context(this));
});


module.exports = app;