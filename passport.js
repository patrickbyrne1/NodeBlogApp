var LocalStrategy = require("passport-local").Strategy;
var bcrypt = require('bcrypt-nodejs');
var mysql = require('./dbcon.js');


module.exports = function(passport) {
    
    //add user id to a session variable
    passport.serializeUser(function(user, done){
        console.log(user);
        done(null, user.userId);
    });

    passport.deserializeUser(function(id, done){
        mysql.pool.query("SELECT * FROM user WHERE userId = ? ", [id], function(err, rows){
            console.log(rows);
            done(err, rows[0]);
        });
    });

    passport.use('local-signup',new LocalStrategy({usernameField : 'username', passwordField: 'password', passReqToCallback: true},
        function(req, username, password, done){
         mysql.pool.query("SELECT * FROM user WHERE email = ? ", [username], function(err, rows){
            if(err)
                return done(err);
          
            if(rows.length){
                return done(null, false, req.flash('signupMessage', 'That is already taken'));
            
            } else {
                var newUserMysql = {
                username: username,
                password: bcrypt.hashSync(password, null, null)
                };
      
                var addUserQuery = "INSERT INTO user (email, password) values (?, ?)";
                console.log(newUserMysql);
                mysql.pool.query(addUserQuery, [newUserMysql.username, newUserMysql.password], function(err, rows){
                    console.log(rows);
                    newUserMysql.id = rows.insertId;
                    console.log(newUserMysql);
                    return done(null, newUserMysql);
                });
            }
            });
        })
    );
    
    passport.use('local-login', new LocalStrategy({usernameField : 'username', passwordField: 'password', passReqToCallback: true},
        function(req, username, password, done){
            mysql.pool.query("SELECT * FROM user WHERE email = ? ", [username], function(err, rows){
                if(err)
                    return done(err);
          
                if(!rows.length){
                    return done(null, false, req.flash('loginMessage', 'No User Found'));
                }
          
                if(!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMessage', 'Wrong Password'));
                //console.log(rows);
                return done(null, rows[0]);
            });
        })
    );
};