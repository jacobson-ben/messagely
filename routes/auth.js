"use strict";
const express = require("express");
const router = new express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const db = require("../db");
const User = require("../models/user")
// const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");


/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;
  const result = await db.query(
    "SELECT password FROM users WHERE username = $1",
    [username]);
  let user = result.rows[0];

  if (user) {
    if (await bcrypt.compare(password, user.password) === true) {
      let token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ token });
    }
  }
  throw new UnauthorizedError("Invalid user/password");
});



/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

 router.post("/register", async function (req, res, next) {
  const {username} = await User.register(req.body);
  
  if (username) {
    let token = jwt.sign({username}, SECRET_KEY)
    return res.json({ token });
  }
  throw new UnauthorizedError("Invalid user/password");
  
});

module.exports = router;