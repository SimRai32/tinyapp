// --------------------DECLARED GLOBAL VARIABLES
const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const { generateRandomString, urlsForUser, getUserByEmail, urlExists, checkEditAndDel, checkEdit, checkReg } = require("./helpers");
const app = express();
const PORT = 3001;
const urlDatabase = {};
const users = {};

// --------------------SETUP AND MIDDLEWARES
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(cookieSession({
  name: "session",
  keys: ["user_id", "totalVisits"],
})
);
app.use(express.urlencoded({ extended: true }));

// --------------------ENDPOINTS / ROUTES
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
  const userID = req.session.user_id;
  const templateVars = { userID , user: users[userID], urls: urlDatabase };
  // Filters out URLS not made by this user
  if (userID) {
    const filtered = urlsForUser(userID, urlDatabase);
    templateVars["urls"] = filtered;
  }
  res.render("urls_index", templateVars);
});

// --------------------NEW URLS PAGE
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  // Checks if user is logged in, if not redirected to login page
  if (!userID) {
    res.redirect("/login");
  } else {
    const templateVars = {userID , user: users[userID]};
    res.render("urls_new", templateVars);
  }
});

// --------------------REGISTRATION PAGE
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  // If user is logged in prevents them from accessing the register page
  if (userID) {
    res.redirect("/urls");
  } else {
    const templateVars = { userID };
    res.render("urls_registry", templateVars);
  }
});

// --------------------LOGIN PAGE
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  } else {
    const templateVars = { userID };
    res.render("urls_login", templateVars);
  }
});

// --------------------REDIRECTS TO GIVEN URL
app.get("/u/:id", (req, res) => {
  const shortLink = req.params.id;
  if (!urlExists(shortLink, urlDatabase)) {
    return res.status(400).send({message: "This short URL does not exist"});
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// --------------------EXISTING URL EDITING PAGES
app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const urlData = urlDatabase[req.params.id];
  const shortLink = req.params.id;
  const potentialErr = checkEdit(userID, urlData, shortLink, urlDatabase);
  if (potentialErr) {
    return res.status(401).send({message: potentialErr});
  } 
  const templateVars = { userID, user: users[userID], shortLink: req.params.id, longURL: urlData.longURL };
  res.render("urls_show", templateVars);
});


// --------------------CREATES THE SHORTENED URL

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    let id = generateRandomString();
    urlDatabase[id] = {
      userID: req.session.user_id,
      longURL:  req.body.longURL
    };
    res.redirect(`/urls/${id}`);
  }
  else {
    return res.status(400).send({message: "Not logged in :("});
  }
});

// --------------------DELETES EXISTING URLS
app.delete("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const urlData = urlDatabase[req.params.id];
  const potentialErr = checkEditAndDel(userID, urlData);
  if (potentialErr) {
    return res.status(400).send({message: potentialErr});
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// --------------------EDITS EXISTING URLS
app.put("/urls/:id/", (req, res) => {
  const userID = req.session.user_id;
  const urlData = urlDatabase[req.params.id];
  const potentialErr = checkEditAndDel(userID, urlData);
  if (potentialErr) {
    return res.status(400).send({message: potentialErr});
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
      return res.status(403).send({message: "Email and/or password are incorrect!"});
    }
  } else {
    return res.status(403).send({message: "Email and/or password are incorrect!"});
  }
  res.redirect("/urls");
});

// --------------------LOGS USER OUT
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// --------------------CREATES ACCOUNT USING REGISTER INFO
app.post("/register", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const potentialErr = checkReg(email, password, users);
  if (potentialErr) {
    return res.status(400).send({message: potentialErr});
  }
  // stores users registration info
  let id = generateRandomString();
  users[id] = {
    id,
    email,
    password: bcrypt.hashSync(password, 10),
  };
  req.session.user_id = id;
  res.redirect("urls");
});

app.listen(PORT, () => {});