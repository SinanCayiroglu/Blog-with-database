import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import localStrategy from "passport-local";
import session from "express-session";
import connectPgSimple from 'connect-pg-simple';

const pgSession = connectPgSimple(session);


const app = express();
const port = 3000;
const API_URL = "http://localhost:3000";
let id = 1;
app.set("view engine", "ejs");

const db = new pg.Client({
  user: "blogwebapp_user",
  host: "dpg-cnqqsda1hbls73dserag-a.frankfurt-postgres.render.com",
  database: "blogwebapp",
  password: "Fe2acZyC5sfPhgoPDKObWGUcTyYHPnEl",
  ssl: {
    rejectUnauthorized: false, // This is required for render.com's SSL configuration
  },
});
db.connect()
  .then(() => console.log("Connected to the PostgreSQL database"))
  .catch((err) => console.error("Error connecting to the database", err));

  passport.use(new localStrategy(async function verify(username, password, cb) {
    try {
      const result = await db.query(`SELECT * FROM logindetail WHERE username = $1`, [username]);
      if (result.rows.length === 0) {
        return cb(null, false, { message: "Incorrect username or password" });
      }
      const row = result.rows[0];
      bcrypt.compare(password, row.password, (err, result) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return cb(null, false, { message: "Failed to compare passwords" });
        } else if (result) {
          // Passwords match, user is authorized
          return cb(null, row);
        } else {
          // Passwords don't match, render login page with error message
          return cb(null, false, { message: "Invalid credentials. Please try again." });
        }
      });
    } catch (err) {
      return cb(err);
    }
  }));

  app.use(
    session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        secure: false  }
    })
  ); 
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser(function(user, cb) {
    cb(null, user.id);
  });
  
  // passport.deserializeUser(function(id, cb) {
  //   // Retrieve user from the database based on the provided ID
  //   // Example assuming you have a `User` model:
  //   db.query('SELECT * FROM users WHERE id = $1', [id], function(err, result) {
  //     if (err) { return cb(err); }
  //     cb(null, user);
  //   });
  // });
  passport.deserializeUser(function(id, done) {
   db.query('SELECT * FROM logindetail WHERE id = $1', [id], function(err, result) {
      if(err)
        return done(err, user);
      if(result.rows.length > 0){
        const user = result.rows[0];
        done(null, user)
      }else{done(null, false)}
    });
  });


  // Custom middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      // If the user is authenticated, allow the request to proceed
    return next();
  } else {
    // If the user is not authenticated, redirect to the login page
    res.redirect("/unauthorized");
  }
}

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

async function getPosts() {
  const result = await db.query("SELECT * FROM posts");
  return result.rows;
}

app.get("/", async (req, res) => {
  try {
    const posts = await getPosts(); // Fetch posts asynchronously
    res.render("index.ejs", { posts }); // Render the index page with fetched posts
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.render("error", { errorMessage: "Failed to fetch posts" });
  }
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/successful-login", (req, res) => {
  res.render("successful-login.ejs");
});

app.post("/login",passport.authenticate('local', { failureRedirect: '/login',successRedirect:"/" }), async (req, res) => {
  
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM loginDetail");
    const loginDetail = result.rows;

    const userExists = loginDetail.some((user) => user.username === username);
    if (userExists) {
      res.send("Username already exists. Choose another username.");
    } else {
      bcrypt.hash(password, 10, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          res.redirect("/error"); // Redirect to an error page or handle error appropriately
        } else {
          const loginPush = await db.query(
            "INSERT INTO loginDetail (username, password) VALUES ($1, $2) RETURNING *;",
            [username, hash]
          ); // Store the hashed password in the database
          res.redirect("/");
        }
      });
    }
  } catch (error) {
    console.error("Error inserting user:", error);
    res.redirect("/error"); // Redirect to an error page or handle error appropriately
  }
});

app.get("/create",ensureAuthenticated, (req, res) => {
  res.render("create.ejs");
});

app.get("/mario", (req, res) => {
  res.render("mario.ejs");
});

app.get("/project", (req, res) => {
  res.render("project.ejs");
});

app.get("/success", (req, res) => {
  res.render("success.ejs");
});

app.get("/unautharized", (req, res) => {
  res.render("unautharized.ejs");
});

app.get("/javacalc", (req, res) => {
  res.render("javacalc.ejs");
});

app.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || "";
    const query =
      "SELECT * FROM posts WHERE lower(title) LIKE $1 or lower(content) LIKE $1";
    const result = await db.query(query, [`%${searchTerm.toLowerCase()}%`]);
    const searchResults = result.rows;

    res.render("searchResults", { searchResults, searchTerm });
  } catch (error) {
    console.log(error);
    res.render("error");
  }
});


app.post("/create",ensureAuthenticated, async (req, res) => {
  
    const result = await db.query("SELECT MAX(id) AS max_id FROM posts");
    const maxId = result.rows[0].max_id || 0; // If no posts exist, set maxId to 0

    // Increment the maximum ID by one to generate a new unique ID
    const newId = maxId + 1;
    const post = {
      id: newId,
      author: req.body.author,
      title: req.body.title,
      content: req.body.content,
    };

    const postPush = await db.query(
      "INSERT INTO posts (id,author,title,content) VALUES($1,$2,$3,$4) RETURNING *;",
      [post.id, post.author, post.title, post.content]
    );
    res.redirect("/")
  
});


app.get("/posts/:idnumber", async function (req, res) {
  const requestedId = parseInt(req.params.idnumber);

  try {
    // Query the database for the post with the requested ID
    const queryResult = await db.query("SELECT * FROM posts WHERE id = $1", [
      requestedId,
    ]);

    if (queryResult.rowCount > 0) {
      // Post found, render the post view with the retrieved post data
      const post = queryResult.rows[0];
      res.render("post", {
        id: post.id,
        author: post.author,
        title: post.title,
        content: post.content,
      });
    } else {
      // Post not found, render an error view
      res.render("error", { errorMessage: "Post not found" });
    }
  } catch (error) {
    // Error occurred during database query, render an error view
    console.error("Error fetching post from database:", error);
    res.render("error", { errorMessage: "Internal server error" });
  }
});

// ... (your existing code)

// Add the following routes for editing and deleting posts:

// Edit post route
app.get("/edit/:idnumber", async function (req, res) {
  const requestedId = parseInt(req.params.idnumber);

  try {
    // Query the database for the post to edit based on its ID
    const result = await db.query("SELECT * FROM posts WHERE id = $1", [
      requestedId,
    ]);
    const postToEdit = result.rows[0]; // Assuming ID is unique, so we expect only one row

    if (postToEdit) {
      // Post found, render the edit view with the post data
      res.render("edit", { post: postToEdit });
    } else {
      // Post not found, redirect to home page or handle appropriately
      res.redirect("/");
    }
  } catch (error) {
    // Error occurred during database query, render an error view
    console.error("Error fetching post to edit:", error);
    res.render("error", { errorMessage: "Internal server error" });
  }
});

// Update post route (after editing)
app.post("/update/:idnumber",ensureAuthenticated, async function (req, res) {
  const requestedId = parseInt(req.params.idnumber);
  const { author, title, content } = req.body;

  try {
    // Check if the user is authorized
    // Update the post in the database
    const result = await db.query(
      "UPDATE posts SET author = $1, title = $2, content = $3 WHERE id = $4 RETURNING *",
      [author, title, content, requestedId]
    );

    if (result.rowCount > 0) {
      // Post updated successfully, redirect to the post page
      res.redirect(`/posts/${requestedId}`);
    } else {
      // Post not found, redirect to the home page or handle appropriately
      res.redirect("/");
    }
  } catch (error) {
    // Error occurred during database update, render an error view
    console.error("Error updating post:", error);
    res.render("error", { errorMessage: "Failed to update post" });
  }
});

// Delete post route
app.post("/delete/:idnumber", async function (req, res) {
  const requestedId = parseInt(req.params.idnumber);

  try {
    // Check if the user is authorized
    
      // Delete the post from the database
      const result = await db.query("DELETE FROM posts WHERE id = $1", [
        requestedId,
      ]);

      if (result.rowCount > 0) {
        // Post deleted successfully, redirect to the home page
        res.redirect("/");
      } else {
        // Post not found, redirect to the home page or handle appropriately
        res.redirect("/");
      }
     
  } catch (error) {
    // Error occurred during database delete operation, render an error view
    console.error("Error deleting post:", error);
    res.render("error", { errorMessage: "Failed to delete post" });
  }
});
// ... (your existing code)

app.post("/submit", (req, res) => {});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
