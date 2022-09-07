const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 3001;

app.set("view engine", "ejs");
app.use(cookieParser());

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {abc123: {
  id: "abc123",
  email: "a@b.com",
  password: "12",
},};

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
  const templateVars = { username:req.cookies["user_id"], user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {username:req.cookies["user_id"], user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {username: req.cookies["user_id"]};
  res.render("urls_registry", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {username: req.cookies["user_id"]};
  res.render("urls_login", templateVars);
})

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  console.log(req.body, id); // Log the POST request body to the console
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userInfo = getUserByEmail(users, req.body.email);
  if (userInfo) {
    if (userInfo.password === req.body.password) {
      res.cookie("user_id", userInfo.id);
    }
    else {
      throw new Error("403 Forbidden:one of the parameters is incorrect");
    }
  }
  else {
    throw new Error("403 Forbidden:one of the parameters is incorrect");
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password) {
    throw new Error("400 Bad Request:Left one or more parameters empty");
  }
  if(getUserByEmail(users,req.body.email)) {
    throw new Error("400 Bad Request:Email already registered");
  }
  let id = generateRandomString();
  users[id] = {};
  users[id].id = id;
  users[id].email = req.body.email;
  users[id].password = req.body.password;
  res.cookie("user_id", id);
  res.redirect("urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { username: req.cookies["user_id"], user: users[req.cookies["user_id"]], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});