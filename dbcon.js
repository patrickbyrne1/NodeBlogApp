var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10,
    host           : 'classmysql.engr.oregonstate.edu',
    user           : 'cs340_schuetky',
    password       : '2397',
    database       : 'cs340_schuetky'
});

module.exports.pool = pool;