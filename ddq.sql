/* database definition queries for blog db */


DROP TABLE IF EXISTS user;

CREATE TABLE `user` (
	`userId` int(11) NOT NULL AUTO_INCREMENT,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	PRIMARY KEY(userId)
	
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1; /* AUTO_INCREMENT to max class size? */

INSERT INTO `user` (`first_name`, `last_name`, `email`) VALUES ('Kyle', 'Schuetz', 'steve@apple.com'), ('Pat', 'Byrne', 'john@microsoft.com'), ('Liu', 'Kang', 'goro@mortalkombat.com');

DROP TABLE IF EXISTS workspace;

CREATE TABLE workspace(
	workspaceId int(11) NOT NULL AUTO_INCREMENT,
	workspace_name varchar(100) NOT NULL, /*call this name or workspace_name??*/
	PRIMARY KEY(workspaceId)
	
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `workspace` (`workspace_name`) VALUES ('Kyle Schuetz Blog'), ('Pat Byrne Blog'), ('Liu Kang Lair');

DROP TABLE IF EXISTS blog_post;

CREATE TABLE blog_post(
	postId int(11) NOT NULL AUTO_INCREMENT,
	workspaceId int(11) NOT NULL,
	userId int(11) NOT NULL,
	title varchar(100) NOT NULL,
	date DATE,  /* do we need to show YYYY-MM-DD format? */
	body TEXT NOT NULL,
	PRIMARY KEY(postId),
	FOREIGN KEY(workspaceId) REFERENCES workspace(workspaceId) ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY(userId) REFERENCES user(userId)  ON UPDATE CASCADE ON DELETE CASCADE
	
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `blog_post` (`workspaceId`, `userId`, `title`, `date`, `body`) 
VALUES 
((SELECT workspaceId FROM workspace WHERE workspace_name = 'Kyle Schuetz Blog'), 
(SELECT userId FROM user WHERE first_name = 'Kyle' AND last_name = 'Schuetz'), 'My First Blog',
CURDATE(), 'This is my first post. It is not going to be very long.')

DROP TABLE IF EXISTS comments;

CREATE TABLE comments(
	commentId int(11) NOT NULL AUTO_INCREMENT,
	userId int(11) NOT NULL,
	postId int(11) NOT NULL,
	workspaceId int(11) NOT NULL,
	date DATE,  /* do we need to show YYYY-MM-DD format? */
	body TEXT NOT NULL,
	PRIMARY KEY(commentId),
	FOREIGN KEY(userId) REFERENCES user(userId)  ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY(postId) REFERENCES blog_post(postId)  ON UPDATE CASCADE ON DELETE CASCADE,
	

) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `comments` (`userId`, `postId`, `workspaceId`, `date`, `body`) VALUES
((SELECT userId FROM user WHERE first_name = 'Pat' AND last_name = 'Byrne'),
(SELECT postId FROM blog_post WHERE title = 'My First Blog'),
(SELECT workspaceId FROM workspace WHERE workspace_name = 'Kyle Schuetz Blog'),
CURDATE(),
'Your blog is terrible!')

DROP TABLE IF EXISTS roles;

CREATE TABLE roles(
	roleId int(11) NOT NULL AUTO_INCREMENT,
	role_name varchar(100) NOT NULL,
	PRIMARY KEY(roleId)

) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

INSERT INTO `roles` (`role_name`) VALUES ('administrator'), ('owner'), ('viewer')

DROP TABLE IF EXISTS permissions_list;

CREATE TABLE permissions_list(
	userId int(11) NOT NULL AUTO_INCREMENT,
	workspaceId int(11) NOT NULL,
	roleId int(11) NOT NULL,
	FOREIGN KEY(userId) REFERENCES user(userId)  ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY(workspaceId) REFERENCES workspace(workspaceId)  ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY(roleId) REFERENCES roles(roleId)  ON UPDATE CASCADE ON DELETE CASCADE

)ENGINE=InnoDB;

INSERT INTO `permissions_list` (`userId`, `workspaceId`, `roleId`) VALUES
((SELECT userId FROM user WHERE first_name = 'Kyle' AND last_name = 'Schuetz'),
(SELECT workspaceId FROM workspace WHERE workspace_name = 'Kyle Schuetz Blog'),
(SELECT roleId FROM roles WHERE role_name = 'administrator'))
