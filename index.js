import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";

const app = express();
const port = 3000;
const API_URL = "http://localhost:3000";
var userIsAuthorised = false;
const loginDetail = [{username:"admin",password:"123456"}];
const posts = [{id:1,author:"Author",title:"Title",content:"Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing."},
{id:2,author:"Author2",title:"Title2",content:"Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing."}];
let id=2;
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"))

app.get("/", (req, res) => {
    
    res.render("index.ejs", {
        posts: posts})
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

  app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = loginDetail.find((user) => user.username === username && user.password === password);

    if (user) {
      userIsAuthorised=true
      res.redirect("successful-login");
    } else {
      res.render("login.ejs", { errorMessage: "Invalid credentials. Please try again." });
    }
    res.render("login.ejs");

  });

  app.get("/signup", (req, res) => {
    res.render("signup.ejs");
  });
  
  app.post("/signup", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const userExists = loginDetail.some((user) => user.username === username);

    if (userExists) {
      res.send("Username already exists. Choose another username.");
    } else {
      loginDetail.push({ username, password });
      res.redirect("/"); 
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




app.post("/create",(req,res)=>{
  if(userIsAuthorised){
    id+=1
    const post = {
        id:id,
        author: req.body.author,
        title: req.body.title,
        content: req.body.content
      };
    
      posts.push(post);
    
      res.redirect("/success");}
      else {
      res.redirect("/unautharized")}
  })
  
  app.get("/posts/:idnumber", function(req, res){
  
      const requestedId = parseInt(req.params.idnumber);
      const post = posts.find(post => post.id === requestedId);
  
      if (post) {
        res.render("post", {
          id:requestedId,
          author:post.author,
          title: post.title,
          content: post.content
        });
      }
    });
  


// ... (your existing code)

// Add the following routes for editing and deleting posts:

// Edit post route
app.get("/edit/:idnumber", function(req, res){
  const requestedId = parseInt(req.params.idnumber);
      const postToEdit = posts.find(post => post.id === requestedId);

  if (postToEdit) {
      res.render("edit", {
          post: postToEdit
      });
  } else {
      // Handle post not found
      res.redirect("/");
  }
});

// Update post route (after editing)
app.post("/update/:idnumber", function(req, res){
    const requestedId = parseInt(req.params.idnumber);
  const postIndex = posts.findIndex(post => post.id === requestedId);
  if(userIsAuthorised){
  if (postIndex !== -1) {
      // Update the post with new data
      posts[postIndex] = {
        id: requestedId,
          author: req.body.author,
          title: req.body.title,
          content: req.body.content
      };

      res.redirect(`/posts/${requestedId}`);
  } else {
      // Handle post not found
      res.redirect("/");
  }}else res.redirect("/unautharized")
});

// Delete post route
app.post("/delete/:idnumber", function(req, res){
  const requestedId = parseInt(req.params.idnumber);

  const postIndex = posts.findIndex(post => post.id === requestedId);
  if(userIsAuthorised){
  if (postIndex !== -1) {
      // Remove the post from the array
      posts.splice(postIndex, 1);
      res.redirect("/");
  } else {
      // Handle post not found
      res.redirect("/");
  }}else res.redirect("/unautharized")
});

// ... (your existing code)


app.post("/submit",(req,res)=>{

})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });