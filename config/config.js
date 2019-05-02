var mysql = require('mysql')
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
const con = {}
con.db = {
    local: {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'sendfree'
    },
    live: {
        'host': 'live host address',
        user: 'user',
        password: 'something',
        database: 'sendfree'
    }
}
con.keepalive = () => {
    con.realConnect = mysql.createConnection((process.env.NODE_ENV === 'dev' ? con.db.local : con.db.live))
    var sessionStore = new MySQLStore({} /* session store options */ , con.realConnect.on('error', (err) => {
            console.log('The connection to the database was lost on error');
            con.realConnect.connect();
        }),
        con.realConnect.connect((err) => {
            if (err) throw err;
            console.log('database connected')
        }));
}
con.keepalive();
module.exports = con;