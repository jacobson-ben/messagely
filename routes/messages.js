"use strict";

const Router = require("express").Router;
const router = new Router();
// const fromPhone =  '+13135588004'

// const { client } = require("../config")
const Message = require("../models/message")
const { UnauthorizedError } = require("../expressError");
const db = require("../db");
const { ensureLoggedIn, authenticateJWT, ensureCorrectUser } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function(req, res, next) {
  const message = await Message.get(req.params.id)
  const toUser = message.to_user.username;
  const fromUser = message.from_user.username;
  if(res.locals.user.username === toUser || res.locals.user.username === fromUser) {
    return res.json({message})
  }
  throw new UnauthorizedError()
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function(req, res, next) {
  const message = await Message.create(req.body);
  const username = message.from_username 

  // client.messages
  //     .create({from: `${fromPhone}`, body: `You have received a message from ${username}`, to: `${phone}`})
  //     .then(message => console.log(message.sid));

  // Add twilio code here: https://www.twilio.com/docs/sms/api/message-resource#create-a-message-resource
  return res.json({message})
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function(req, res, next) {
  const message = await Message.get(req.params.id)
  const toUser = message.to_user.username;
  if(res.locals.user.username === toUser) {
    const markRead = await Message.markRead(req.params.id)
    return res.json({markRead})
  }
  throw new UnauthorizedError()
})


module.exports = router;

// "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJlbm55IiwiaWF0IjoxNjE3MTI0MTU2fQ.K-ejAN60mPZJ9DmN4IE4FTkWz2sqyI7LSrj_Ppq6x00"
// "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImthdGh1YW5nIiwiaWF0IjoxNjE3MTI0MjkwfQ.QPLn8oPSGCI8Az2qyhdQJK-p_T3tMNJjRVrXRkuIQ04"
