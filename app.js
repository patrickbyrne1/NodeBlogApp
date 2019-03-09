var express = require('express'),
    app = express(),
    mysql = require('./dbcon.js'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    flash = require('connect-flash'),
    expressSanitizer = require('express-sanitizer');

require('./passport.js')(passport);
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(cookieParser());
app.use(flash());
app.use(express.static("public"));
app.set("view engine", "ejs");

//passport
app.use(session({
    secret: 'jShitty wizards make clumsy traveling partners',
    resave:true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('port', 55770);


app.get("/", function(req, res){
    res.redirect("/home");
});

//login page
app.get("/login", function(req, res){
    res.render("login.ejs", {message:req.flash('loginMessage')});
});

//authenticate route
app.post('/login', passport.authenticate('local-login', {
        successRedirect: "/home",
        failureRedirect: "/login",
        failureFlash: true
    }), function(req, res){
     if(req.body.remember){
         req.session.cookie.maxAge = 1000 * 60 * 3;
    } else {
      req.session.cookie.expires = false;
     }
     res.redirect('/');
});

//new user route
app.post("/createuser", passport.authenticate('local-signup', {
    successRedirect: "/workspaces/new",
    failureRedirect: "/workspaces/new",
    failureFlash: true
}));

//new blog route
app.get("/blogs/new", function(req, res){
    res.render("new");
});

//new workspace route
app.get("/workspaces/new", function(req, res){
    var context = {};
    var users = {};
    var workspaces = {}
    mysql.pool.query("SELECT userId, first_name, last_name, email FROM user", function(err, rows, fields){
        if(err){
            res.redirect("/home");
        }
        users.records = JSON.parse(JSON.stringify(rows));

        mysql.pool.query("SELECT workspaceId, workspace_name FROM workspace", function(err, rows, fields){
            workspaces.names = JSON.parse(JSON.stringify(rows));

            mysql.pool.query("SELECT u.first_name, u.last_name, w.workspace_name, r.role_name FROM permissions_list p INNER JOIN user u ON p.userId = u.userId INNER JOIN roles r ON p.roleId = r.roleId INNER JOIN workspace w ON p.workspaceId = w.workspaceId", function(err, rows, fields){
                if(err){
                    res.redirect("/home");
                }
                context.results = JSON.parse(JSON.stringify(rows));
                console.log(context);
                console.log(users);
                console.log({users: users, context: context})
                res.render("admin", {users: users, workspaces: workspaces, context: context});
            });
        });   
    });
    
});


//show all workspaces route
app.get("/home", function(req, res, next){
    var context = {};

    mysql.pool.query('SELECT * FROM workspace', function(err, rows, fields){
        if(err){
            res.redirect("home");
        }
        context.results = JSON.parse(JSON.stringify(rows));
        console.log(context);
        console.log(req.isAuthenticated());
        res.render("home", context);
    });  
});

//show all blogs for a specific workspace
app.get("/workspaces/:id", function(req, res, next) {
    var id = req.params.id;
    var context = {};
    console.log(id);
    mysql.pool.query("SELECT b.postId, b.image, b.title, b.date, u.first_name, u.last_name, b.body FROM blog_post b INNER JOIN workspace w ON b.workspaceId = w.workspaceId INNER JOIN permissions_list p ON w.workspaceId = p.workspaceId INNER JOIN user u ON p.userId = u.userId WHERE b.workspaceId = ?", [id], function(err, rows, fields){
        if(err){
            res.redirect("home");
        }
        context.results = JSON.parse(JSON.stringify(rows));
        console.log(context);
        
        res.render("allblog", context);
    });  
});

//show individual blog route
app.get("/blogs/:id", function(req, res) {
    
    var id = req.params.id;
    var context = {};
    console.log(id);
    
    mysql.pool.query("SELECT blog.postId, blog.title, blog.image, blog.date, blog.body, blog.first_name, blog.last_name, comment.userFirstName, comment.userLastName, comment.commentDate, comment.commentBody, comment.commentId FROM (SELECT p.postId, p.title, p.image, p.date, p.body, u.first_name, u.last_name FROM blog_post p INNER JOIN user u ON p.userId = u.userId WHERE p.postId = ?) as blog LEFT JOIN (SELECT c.commentId, c.userId, c.postId, c.date as commentDate, c.body as commentBody, u.userId as commentUserId, u.first_name as userFirstName, u.last_name as userLastName FROM comments c INNER JOIN user u ON c.userId = u.userId) as comment ON blog.postId = comment.postId ORDER BY comment.commentId", [id], function(err, rows, fields){
        if(err){
            res.redirect("home")
        }
        context.results = JSON.parse(JSON.stringify(rows));
        console.log(context);
        res.render("show", context);
    }); 
});


//create comment route
app.post("/blogs/:id/comments", function(req, res){
    var id = req.body.id;
    var body = req.body.comment;
    var date = new Date();
    console.log(id);
    console.log(body);
    if (req.isAuthenticated()){
        var userId = req.user.userId;
        console.log(userId);
        mysql.pool.query("INSERT INTO `comments` (`postId`, `userId`, `date`, `body`) VALUES (?,?,?,?)", [id, userId, date, body], function(err, result){
            if(err){
                res.redirect("/home");
        }
        res.redirect("/blogs/"+ id);
        });
    } else {
        alert("You must be logged in to do that!");
        res.redirect("/blogs/" + id);
    }
    
})

//create blog route
app.post("/blogs", function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);
    var title = req.body.blog.title;
    var image = req.body.blog.image;
    var date =  new Date();
    var body = req.body.blog.description;
    console.log(req.body.blog.body);
    
    if(req.isAuthenticated()){
        var userId = req.user.userId;
        var context = {};
        mysql.pool.query("SELECT userId, workspaceId, roleId FROM permissions_list WHERE userId = ?", [userId], function(err, rows,fields){
            context.results = JSON.parse(JSON.stringify(rows));
            if (context.results[0].roleId == 4) {
                mysql.pool.query("INSERT INTO `blog_post` (`workspaceId`, `userId`, `title`, `date`, `body`, `image`) VALUES (?,?,?,?,?,?)", [context.results[0].workspaceId, userId, title, date, body, image], function(err, result){
                    if(err){
                        res.redirect("/home");
                }
                res.redirect("/workspaces/" + context.results[0].workspaceId);
                });
            }
        })
        
    } else {
        alert("You must be logged in to create a blog!");
        res.redirect("/login");
    }
    
});

//create workspace route
app.post("/workspaces", function(req, res){
    var name = req.body.workspace.name;
    console.log(name);
    mysql.pool.query("INSERT INTO `workspace` (`workspace_name`) VALUES (?)", [name], function(err, result){
        if(err){
            res.redirect("home");
    }
    res.redirect("/workspaces/new");
    });
})

//create role route
app.post("/roles", function(req, res){
    var email = req.body.username;
    var workspace = req.body.workspace_name;
    var admin = req.body.admin;
    var owner = req.body.owner;
    var viewer = req.body.viewer;
    var role = 0;
    if(typeof(admin) !== "undefined"){
        role = admin;
    } 
    else if (typeof(owner) !== "undefined"){
        role = owner;
    } 
    else if (typeof(viewer) !== "undefined"){
        role = viewer;
    }
    var context = {};
    mysql.pool.query("SELECT userId from user WHERE email=?", [email], function(err,rows,fields){
        if(err) {
            res.redirect("/home");
        }
        context.results = JSON.parse(JSON.stringify(rows));
        console.log(context);
        secondQuery = {};
        mysql.pool.query("SELECT workspaceId FROM workspace WHERE workspace_name = ?", [workspace], function(err,rows,fields){
            if(err){
                res.redirect("/home");
            }
            secondQuery.results = JSON.parse(JSON.stringify(rows));
            console.log(secondQuery);
            mysql.pool.query("INSERT INTO `permissions_list` (`userId`, `workspaceId`, `roleId`) VALUES (?,?,?)", 
            [context.results[0].userId, secondQuery.results[0].workspaceId, role], function(err, rows, fields){
                if(err){
                    res.redirect("/home");
                }
                res.redirect("/workspaces/new");
                });
            });
        });
});

//edit blog route
app.get("/blogs/:id/edit", function(req, res) {
    
    var id = req.params.id;
    var context = {};

    mysql.pool.query("SELECT postId, title, image, body FROM blog_post WHERE postId = ?", [id], function(err, rows, fields){
        if(err){
            res.redirect("/home");
        }
        context.results = JSON.parse(JSON.stringify(rows));
        console.log(context);
        res.render("edit", context);
    }); 
});

//edit user route
app.get("/users/:id/edit", function(req, res) {
    
    var id = req.params.id;
    var context = {};
    mysql.pool.query("SELECT userId, first_name, last_name, email FROM user WHERE userId = ?", [id], function(err, rows, fields){
        if(err){
            res.redirect("/home");
        }
        context.results = JSON.parse(JSON.stringify(rows));
        console.log(context);
        res.render("edituser", context);
    });   
});

//update route
app.post("/blogs/:id", function(req, res){
    
    var id = req.params.id;
    // req.body.blog.body = req.sanitize(req.body.blog.body);
    var title = req.body.blog.title;
    var image = req.body.blog.image;
    var body = req.body.blog.description;
    console.log(id);
    console.log(body);
    console.log(title);
    var context = {};
    mysql.pool.query("SELECT * FROM blog_post WHERE postId=?", [id], function(err, result){
        if(err){
            res.redirect("/home");
        }
        console.log(result);
        if(result.length == 1){
        var curVals = result[0];
        mysql.pool.query("UPDATE blog_post SET title=?, image=?, body=? WHERE postId=? ",
            [title || curVals.title, image || curVals.image, body || curVals.body, id],
            function(err, result){
            if(err){
                res.redirect("home");
            }

            res.redirect('/blogs/' + req.params.id);
        });
        }
    });
    
});

//update user
app.post("/users/:id", function(req,res){

    var id = req.params.id;
    var first_name = req.body.user.first_name;
    var last_name = req.body.user.last_name;
    var email = req.body.user.email;
    var context = {};

    mysql.pool.query("SELECT * FROM user WHERE userId=?", [id], function(err, result){
        if(err){
            res.redirect("/home");
        }
        console.log(result);
        if(result.length == 1){
        var curVals = result[0];
        mysql.pool.query("UPDATE user SET first_name=?, last_name=?, email=? WHERE userId=? ",
            [first_name || curVals.first_name, last_name || curVals.last_name, email || curVals.email, id],
            function(err, result){
            if(err){
                res.redirect("/home");
            }

            res.redirect("/workspaces/new");
        });
        }
    });

})

//delete comments route
app.post("/comments/:id", function(req, res){
    var id = req.body.id;
    var blogId = req.body.blogId;
    console.log(id);
    console.log(req.body);
    mysql.pool.query("DELETE FROM comments WHERE commentId=?", [id], function(err, result){
        if(err){
            res.redirect("/home")
        } else {
            res.redirect("/blogs/" + blogId);
        }
        
    });
});

//delete blog post route
app.post("/blogs/:id/delete", function(req, res){
    var id = req.body.postId;
    var context = {};
    console.log(id);
    mysql.pool.query("SELECT workspaceId FROM blog_post WHERE postId = ?", [id], function(err,rows, fields){
        if(err){
            res.redirect("/home");
        }
        context.results = JSON.parse(JSON.stringify(rows));
        console.log(context);
        console.log(context.results[0].workspaceId);
        mysql.pool.query("DELETE FROM blog_post WHERE postId=?", [id], function(err, result){
            if(err){
                res.redirect("/home")
            } else {
                res.redirect("/workspaces/" + context.results[0].workspaceId);
            }
            
        });
    });  
});

function isLoggedIn(req, res, next){
    
    if(req.isAuthenticated()){
        return next();
    } else {
        res.redirect('/');
    }  
}

app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});