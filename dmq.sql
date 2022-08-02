/* database manipulation queries for blog db */


/* SELECT QUERIES */


--NEW: select all workspaces
SELECT * FROM workspace


-- NEW: select individual blogs to show blog route
SELECT blog.postId, blog.title, blog.image, blog.date, blog.body, blog.first_name, blog.last_name, comment.userFirstName, comment.userLastName, comment.commentDate, 
comment.commentBody, comment.commentId FROM (SELECT p.postId, p.title, p.image, p.date, p.body, u.first_name, u.last_name FROM blog_post p INNER JOIN user u ON p.userId = u.userId 
WHERE p.postId = ?) as blog LEFT JOIN (SELECT c.commentId, c.userId, c.postId, c.date as commentDate, c.body as commentBody, u.userId as commentUserId, u.first_name as userFirstName, 
u.last_name as userLastName FROM comments c INNER JOIN user u ON c.userId = u.userId) as comment ON blog.postId = comment.postId ORDER BY comment.commentId
        

--NEW: select individual workspaces by user first/last name and permissions role
SELECT u.first_name, u.last_name, w.workspace_name, r.role_name FROM permissions_list p INNER JOIN user u ON p.userId = u.userId 
INNER JOIN roles r ON p.roleId = r.roleId INNER JOIN workspace w ON p.workspaceId = w.workspaceId


--NEW: select all blogs from a particular workspace
SELECT b.postId, b.image, b.title, b.date, u.first_name, u.last_name, b.body FROM blog_post b INNER JOIN workspace w ON b.workspaceId = w.workspaceId 
INNER JOIN permissions_list p ON w.workspaceId = p.workspaceId INNER JOIN user u ON p.userId = u.userId WHERE b.workspaceId = ?

--select all workspaceIds
SELECT workspaceId FROM workspace


--select individual workspaces, input parameters will be handled programatically from node/flask route
SELECT workspaceId, workspace_name FROM workspace WHERE workspaceId = :workspaceIdInput

--select all blog posts
SELECT postId FROM blog_post


--select individual blog post
SELECT postId FROM blog_post WHERE postId = :postIdInput

--select comments for blog post
SELECT u.first_name, u.last_name, c.date, c.body
FROM comments c INNER JOIN users u ON
c.userId = u.userId
WHERE c.postId = :postIdInput

--select all users and permissions (for admin)
SELECT userId, workspaceId, roleId
FROM permissions_list






-- add a new user
INSERT INTO user (`first_name`, `last_name`, 	emailInput) VALUES (:first_nameInput, :last_nameInput, :emailInput);

-- add a new workspace
INSERT INTO workspace (`workspace_name`) VALUES (:workspace_name);

-- add a new blog post
INSERT INTO `blog_post` (`workspaceId`, `userId`, `title`, `date`, `body`) 
VALUES 
((SELECT workspaceId FROM workspace WHERE workspace_name = :workspace_name), 
(SELECT userId FROM user WHERE first_name = :first_name AND last_name = :last_name), :title, CURDATE(), :body);

-- add a new comment
INSERT INTO `comments` (`userId`, `postId`, `workspaceId`, `date`, `body`) VALUES
((SELECT userId FROM user WHERE first_name = :first_name AND last_name = :last_name),
(SELECT postId FROM blog_post WHERE title = :title),
(SELECT workspaceId FROM workspace WHERE workspace_name = :workspace_name),
CURDATE(),
:body)



/* UPDATE QUERIES */

-- NEW: update blog route
UPDATE blog_post SET title=?, image=?, body=? WHERE postId=? 

--update blog post
UPDATE blog_post
SET body=:body
WHERE postId = :postId;

--update user permissions
UPDATE permissions_list
SET roleId=:roleId
WHERE userId=:userId;

--update comment
UPDATE comment
SET comment=:comment
WHERE (SELECT userId FROM user WHERE first_name=:first_name AND last_name=:last_name);




/* DELETE QUERIES */


--NEW: delete comment based on commentId
DELETE FROM comments WHERE commentId=?

--NEW: delete blog post based on postID
DELETE FROM blog_post WHERE postId=?



-- delete user
DELETE FROM user WHERE first_name=:first_name AND last_name=:last_name;


--delete workspace
DELETE FROM workspace WHERE workspace_name=:workspace_name;


--delete blog post
DELETE FROM blog_post WHERE title=:title;


--delete comment
DELETE FROM comments WHERE (SELECT userId FROM user WHERE first_name=:first_name AND last_name=:last_name);

