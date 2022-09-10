const generateRandomString = () => {
  return Math.random().toString(36).substring(2,8);
};

const urlsForUser = (id, urlDatabase) => {
  const urlList = {};
  const keys = Object.keys(urlDatabase);
  for (const key of keys) {
    // checks if the user made the URL
    if (urlDatabase[key].userID === id) {
      urlList[key] = {longURL: urlDatabase[key].longURL, shortURL:key};
    }
  }
  return urlList;
};

const getUserByEmail = (obj, email) => {
  if (!obj) {
    return null;
  }
  const keys = Object.keys(obj);
  for (const key of keys) {
    // checks if email is in database
    if (obj[key].email === email) {
      // returns user's info if it is
      return obj[key];
    }
  }
  return null;
};

const urlExists = (shortlink, obj) => {
  const keys = Object.keys(obj);
  return keys.includes(shortlink);
}

const checkEditAndDel = (userID, urlData) => {
  // checks if user is logged in
  if (!userID) {
    return "Not logged in :(";
  }
  // checks if link exists
  if (!urlData) {
    return "This link does not exist :(";
  }
  // checks if the URL is owned by user
  if (userID  !== urlData.userID) {
    return  "Cannot edit URL you do not own :(";
  }
  return null;
}

const checkEdit = (userID, urlData, shortLink, urlDatabase) => {
  //checks if page exists
  if (!urlExists(shortLink, urlDatabase)) {
    return "This page does not exist :(";
  }
   // checks if the user is logged in
  if (!userID) {
    return "You need to login to access this page";
  }
  // checks if the URL is owned by user
  if (userID  !== urlData.userID) {
    return "You're trying to access a page you do not have access to";
  }
  return null;
}

const checkReg = (email, password, users) => {
  // Checks if both email and password have been filled out
  if (!email || !password) {
    return "Need to fill in BOTH email and password!";
  }
  // Checks if email is in the database
  if (getUserByEmail(users,email)) {
    return "Email already registered!";
  }
  return null;
}

module.exports = {
  generateRandomString,
  urlsForUser,
  getUserByEmail,
  urlExists,
  checkEditAndDel,
  checkEdit,
  checkReg,
};