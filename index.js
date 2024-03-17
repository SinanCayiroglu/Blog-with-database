import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";

const app = express();
const port = 3000;
const API_URL = "http://localhost:3000";
var userIsAuthorised = false;
let loginDetail = [{id:1,username:"admin",password:"123456"}];
const posts = [{id:1,author:"Author",title:"Title",content:"Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing."}]
let id=1;
app.set('view engine', 'ejs');

const db = new pg.Client({
  user: "blogwebapp_user",
  host: "dpg-cnqqsda1hbls73dserag-a.frankfurt-postgres.render.com",
  database: "blogwebapp",
  password: "Fe2acZyC5sfPhgoPDKObWGUcTyYHPnEl",
  port: 5432,
  ssl: {
    rejectUnauthorized: false // This is required for render.com's SSL configuration
  }
});
db.connect()
  .then(() => console.log('Connected to the PostgreSQL database'))
  .catch(err => console.error('Error connecting to the database', err));


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"))

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
    res.render("about.ejs")
  });

app.get("/contact", (req, res) => {
    res.render("contact.ejs")
  });

  app.get("/login", (req, res) => {
    res.render("login.ejs");
  });

  app.get("/successful-login", (req, res) => {
    res.render("successful-login.ejs");
  });

  app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const result = await db.query("SELECT * FROM loginDetail");
    const loginDetail = result.rows;
    
    const user = loginDetail.find((user) => user.username === username && user.password === password);
  
    if (user) {
      userIsAuthorised = true;
      res.redirect("successful-login");
    } else {
      res.render("login.ejs", { errorMessage: "Invalid credentials. Please try again." });
    }
  });

  app.get("/signup", (req, res) => {
    res.render("signup.ejs");
  });
  
  app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const result = await db.query("SELECT * FROM loginDetail");
  const loginDetail = result.rows;
  
  const userExists = loginDetail.some((user) => user.username === username);
  
  if (userExists) {
    res.send("Username already exists. Choose another username.");
  } else {
    try {
      const loginPush = await db.query("INSERT INTO loginDetail (username, password) VALUES ($1, $2) RETURNING *;",
        [username, password]);
      res.redirect("/");
    } catch (error) {
      console.error("Error inserting user:", error);
      res.redirect("/error"); // Redirect to an error page or handle error appropriately
    }
  }
});

  app.get("/create", (req, res) => {
    res.render("create.ejs")
  });

  app.get("/project", (req, res) => {
    res.render("project.ejs")
  });

  app.get("/success", (req, res) => {
    res.render("success.ejs")
  });

  app.get("/unautharized", (req, res) => {
    res.render("unautharized.ejs")
  });

  app.get("/javacalc", (req, res) => {
    res.render("javacalc.ejs")
  });

  app.get('/search', (req, res) => {
    const searchTerm = req.query.searchTerm || '';
    const searchResults = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    res.render('searchResults', { searchResults, searchTerm });
  });




app.post("/create", async(req,res)=>{
  if(userIsAuthorised){
    id+=1
    const post = {
        id:id,
        author: req.body.author,
        title: req.body.title,
        content: req.body.content
      };
    
      const postPush = await db.query("INSERT INTO posts (id,author,title,content) VALUES($1,$2,$3,$4) RETURNING *;",
      [post.id, post.author, post.title, post.content])
      
    
      res.redirect("/success");}
      else {
      res.redirect("/unautharized")}
  })
  
  app.get("/posts/:idnumber", async function(req, res) {
    const requestedId = parseInt(req.params.idnumber);
  
    try {
      // Query the database for the post with the requested ID
      const queryResult = await db.query('SELECT * FROM posts WHERE id = $1', [requestedId]);
      
      if (queryResult.rowCount > 0) {
        // Post found, render the post view with the retrieved post data
        const post = queryResult.rows[0];
        res.render("post", {
          id: post.id,
          author: post.author,
          title: post.title,
          content: post.content
        });
      } else {
        // Post not found, render an error view
        res.render("error", { errorMessage: "Post not found" });
      }
    } catch (error) {
      // Error occurred during database query, render an error view
      console.error('Error fetching post from database:', error);
      res.render("error", { errorMessage: "Internal server error" });
    }
  });
  
  


// ... (your existing code)

// Add the following routes for editing and deleting posts:

// Edit post route
app.get("/edit/:idnumber", async function(req, res) {
  const requestedId = parseInt(req.params.idnumber);

  try {
    // Query the database for the post to edit based on its ID
    const result = await db.query("SELECT * FROM posts WHERE id = $1", [requestedId]);
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
    console.error('Error fetching post to edit:', error);
    res.render("error", { errorMessage: "Internal server error" });
  }
});

// Update post route (after editing)
app.post("/update/:idnumber", async function(req, res) {
  const requestedId = parseInt(req.params.idnumber);
  const { author, title, content } = req.body;

  try {
    // Check if the user is authorized
    if (userIsAuthorised) {
      return res.redirect("/unauthorized");
    }

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
app.post("/delete/:idnumber", async function(req, res) {
  const requestedId = parseInt(req.params.idnumber);

  try {
    // Check if the user is authorized
    if (userIsAuthorised) {
      return res.redirect("/unauthorized");
    }

    // Delete the post from the database
    const result = await db.query("DELETE FROM posts WHERE id = $1", [requestedId]);

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


app.post("/submit",(req,res)=>{

})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });