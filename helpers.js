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

module.exports = {
  generateRandomString,
  urlsForUser,
  getUserByEmail,
};