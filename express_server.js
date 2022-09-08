// --------------------DECLARED GLOBAL VARIABLES
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { generateRandomString, urlsForUser, getUserByEmail } = require("./helpers");
const app = express();
const PORT = 3001;
const urlDatabase = {};
const users = {};

// --------------------SETUP AND MIDDLEWARES
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["user_id"],
})
);
app.use(express.urlencoded({ extended: true }));

// --------------------ENDPOINTS / ROUTES
// --------------------GET
// --------------------BASIC TESTS
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// --------------------URLS PAGE
app.get("/urls", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { username: id , user: users[id], urls: urlDatabase };
  // Filters out URLS not made by this user
  if (id) {
    const filtered = urlsForUser(id, urlDatabase);
    templateVars["urls"] = filtered;
  }
  res.render("urls_index", templateVars);
});

// --------------------NEW URLS PAGE
app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  // Checks if user is logged in, if not redirected to login page
  if (!id) {
    res.redirect("/login");
  } else {
    const templateVars = {username: id , user: users[id]};
    res.render("urls_new", templateVars);
  }
});

// --------------------REGISTRATION PAGE
app.get("/register", (req, res) => {
  const id = req.session.user_id;
  // If user is logged in prevents them from accessing the register page
  if (id) {
    res.redirect("/urls");
  } else {
    const templateVars = { username: id };
    res.render("urls_registry", templateVars);
  }
});

// --------------------LOGIN PAGE
app.get("/login", (req, res) => {
  const id = req.session.user_id;
  if (id) {
    res.redirect("/urls");
  } else {
    const templateVars = { username: id };
    res.render("urls_login", templateVars);
  }
});

// --------------------REDIRECTS TO GIVEN URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.status(400).send({message: 'Bad Request:This short URL does not exist'});
  }
  res.redirect(longURL);
});

// --------------------EXISTING URL EDITING PAGES
app.get("/urls/:id", (req, res) => {
  const id = req.session.user_id;
  const urlData = urlDatabase[req.params.id];
  // checks if the URL is owned by user
  if (!(id === urlData.userID)) {
    return res.status(400).send({message: 'Cannot edit URL you do not own :('});
  }
  const templateVars = { username: id, user: users[id], id: req.params.id, longURL: urlData.longURL };
  res.render("urls_show", templateVars);
});

// --------------------PUT
// --------------------CREATES THE SHORTENED URL

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    let id = generateRandomString();
    urlDatabase[id] = {};
    urlDatabase[id].userID = req.session.user_id;
    urlDatabase[id].longURL = req.body.longURL;
    console.log(urlDatabase[id], id); // Log the POST request body to the console
    res.redirect(`/urls/${id}`);
  }
});

// --------------------DELETES EXISTING URLS
app.post("/urls/:id/delete", (req, res) => {
  const id = req.session.user_id;
  const urlData = urlDatabase[req.params.id];
  // checks if user is logged in
  if (!id) {
    return res.status(400).send({message: 'Not logged in :('});
  }
  // checks if link exists
  if (!urlData) {
    return res.status(400).send({message: 'This link does not exist :('});
  }
  // checks if the URL is owned by user
  if (!(id  === urlData.userID)) {
    return res.status(400).send({message: 'Cannot edit URL you do not own :('});
  }
 
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// --------------------EDITS EXISTING URLS
app.post("/urls/:id/edit", (req, res) => {
  const id = req.session.user_id;
  const urlData = urlDatabase[req.params.id];
  // checks if user is logged in
  if (!id) {
    return res.status(400).send({message: 'Not logged in :('});
  }
  // checks if link exists
  if (!urlData) {
    return res.status(400).send({message: 'This link does not exist :('});
  }
  // checks if the URL is owned by user
  if (!(id  === urlData.userID)) {
    return res.status(400).send({message: 'Cannot edit URL you do not own :('});
  }

  urlData.longURL = req.body.longURL;
  res.redirect("/urls");
});

// --------------------PROCESSES LOGIN INFO
app.post("/login", (req, res) => {
  const userInfo = getUserByEmail(users, req.body.email);
  const password = req.body.password;
  // Checks if email is in the database
  if (userInfo) {
    // Checks if password matches
    if (bcrypt.compareSync(password, userInfo.password)) {
      req.session.user_id = userInfo.id;
    } else {
      return res.status(403).send({message: 'Email and/or password are incorrect!'});
    }
  } else {
    return res.status(403).send({message: 'Email and/or password are incorrect!'});
  }
  res.redirect("/urls");
});

// --------------------LOGS USER OUT
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

// --------------------CREATES ACCOUNT USING REGISTER INFO
app.post("/register", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  // Checks if both email and password have been filled out
  if (!email || !password) {
    return res.status(400).send({message: 'Need to fill in BOTH email and password!'});
  }
  // Checks if email is in the database
  if (getUserByEmail(users,email)) {
    return res.status(400).send({message: 'Email already registered!'});
  }
  let id = generateRandomString();
  users[id] = {};
  users[id].id = id;
  users[id].email = email;
  users[id].password = bcrypt.hashSync(password, 10);
  req.session.user_id = id;
  res.redirect("urls");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});