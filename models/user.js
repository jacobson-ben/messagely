"use strict";

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");

const { UnauthorizedError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
          VALUES ($1, $2, $3, $4, $5)`, [username, hashedPassword, first_name, last_name, phone])
    return res.json(result.rows[0])
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users WHERE username = $1`, [username])
    const user = result.rows[0]
    
    if(user) {
      return await bcrypt.compare(password, user.password) === true
    }
    throw new UnauthorizedError("Invalid username/password")
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const lastLogin = Date.now()
    db.query(
      `UPDATE users
        SET last_login_at = $1
        WHERE username = $2`, [lastLogin, username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = db.query(
      `SELECT username, first_name, last_name
        FROM users`)
    return res.json(results.rows)
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users WHERE username = $1`, [username])
    return res.json(results.rows[0])
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messageResults = db.query(
      `SELECT id, body, sent_at, read_at
        FROM messages WHERE from_username = $1`, [username])
    const messages = messageResults.rows
    const userResults = db.query(
      `SELECT username, first_name, last_name, phone
      FROM users WHERE username = $1`, [username])
    const user = userResults.rows[0]
    for(let msg of messages) {
      msg.from_user = user
    }
    return res.json(messages)
  }
  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messageResults = db.query(
      `SELECT id, body, sent_at, read_at
        FROM messages WHERE to_username = $1`, [username])
    const messages = messageResults.rows
    const userResults = db.query(
      `SELECT username, first_name, last_name, phone
      FROM users WHERE username = $1`, [username])
    const user = userResults.rows[0]
    for(let msg of messages) {
      msg.to_user = user
    }
    return res.json(messages)
  }
}


module.exports = User;
