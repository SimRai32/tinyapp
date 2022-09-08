const express = require("express");
const cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 3001;
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["user_id"],
}));
function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

const urlsForUser = id => {
  const urlList = {};
  const keys = Object.keys(urlDatabase);
  for (const key of keys) {
    if (urlDatabase[key].userID === id) {
      urlList[key] = {longURL: urlDatabase[key].longURL, shortURL:key};
    }
  }
  return urlList;
}

const getUserByEmail = (obj, email) => {
  if (!obj) {
    return null;
  }
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (obj[key].email === email) {
      return obj[key];
    }
  }
  return null;
};




const urlDatabase = {};


const users = {};

app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { username:req.session.user_id , user: users[req.session.user_id ], urls: urlDatabase };
  if (req.session.user_id ) {
    const filtered = urlsForUser(req.session.user_id );
    templateVars["urls"] = filtered;
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id ) {
    res.redirect("/login");
  }
  const templateVars = {username:req.session.user_id , user: users[req.session.user_id ]};
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id ) {
    res.redirect("/urls");
  }
  const templateVars = {username: req.session.user_id ,};
  res.render("urls_registry", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id ) {
    res.redirect("/urls");
  }
  const templateVars = {username: req.session.user_id };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.session.user_id ) {
  let id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id].userID = req.session.user_id ;
  urlDatabase[id].longURL = req.body.longURL;
  console.log(urlDatabase[id], id); // Log the POST request body to the console
  res.redirect(`/urls/${id}`);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id ) {
    return res.status(400).send({message: 'Not logged in :('});
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send({message: 'This link does not exist :('});
  } 
  if (!(req.session.user_id  === urlDatabase[req.params.id].userID)) {
    return res.status(400).send({message: 'Cannot edit URL you do not own :('});
  }
 
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
  
  
});

app.post("/urls/:id/edit", (req, res) => {
  if (!req.session.user_id ) {
   return res.status(400).send({message: 'Not logged in :('});
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send({message: 'This link does not exist :('});
  } 
  if (!(req.session.user_id  === urlDatabase[req.params.id].userID)) {
    return res.status(400).send({message: 'Cannot edit URL you do not own :('});
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userInfo = getUserByEmail(users, req.body.email);
  const password = req.body.password
  if (userInfo) {
    if (bcrypt.compareSync(password, userInfo.password)) {
      req.session.user_id = userInfo.id;
    }
    else {
      return res.status(403).send({message: 'Email and/or password are incorrect!'});
    }
  }
  else {
    return res.status(403).send({message: 'Email and/or password are incorrect!'});
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password) {
    return res.status(400).send({message: 'Need to fill in BOTH email and password!'});
  }
  if(getUserByEmail(users,req.body.email)) {
    return res.status(400).send({message: 'Email already registered!'});
  } else if (req.body.email && req.body.password) {
    let id = generateRandomString();
    const password = req.body.password;
    users[id] = {};
    users[id].id = id;
    users[id].email = req.body.email;
    users[id].password = bcrypt.hashSync(password, 10);
    req.session.user_id = id;
    res.redirect("urls");
  }
  
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if(!longURL) {
    return res.status(400).send({message: 'Bad Request:This short URL does not exist'});
  }
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  if (!(req.session.user_id  === urlDatabase[req.params.id].userID)) {
    return res.status(400).send({message: 'Cannot edit URL you do not own :('});
  }
  const templateVars = { username: req.session.user_id , user: users[req.session.user_id ], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});