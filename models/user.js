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
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
          VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
          RETURNING username, password, first_name, last_name, phone`, [username, hashedPassword, first_name, last_name, phone]);
    
    return result.rows[0];
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
    const results = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at`,
        [username])
    if (results.rows.length === 0) {
      next (new UnauthorizedError());
    }
    
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name
        FROM users`)
    return results.rows;
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
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users WHERE username = $1`, [username]);
    if (results.rows[0]) {
      return results.rows[0];
    } 
    return next(new UnauthorizedError());
  }
    
  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messageResults = await db.query(
      `SELECT id, body, sent_at, read_at
        FROM messages WHERE from_username = $1`, [username])
    const messages = messageResults.rows;
    if (!messages) {
      return next(new UnauthorizedError());
    }
    const userResults = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users WHERE username = $1`, [username])
    const user = userResults.rows[0]
    for(let msg of messages) {
      msg.from_user = user
    }
    return messages;
  }
  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messageResults = await db.query(
      `SELECT id, body, sent_at, read_at, username, first_name, last_name, phone
        FROM messages m WHERE to_username = $1
        JOIN users u ON u.username = m.to_username`, [username])
    const messages = messageResults.rows;
    if (!messages) {
      return next(new UnauthorizedError());
    }

    let output = {
      
    }

    // const userResults = await db.query(
    //   `SELECT username, first_name, last_name, phone
    //   FROM users WHERE username = $1`, [username])
    // const user = userResults.rows[0]
    // for(let msg of messages) {
    //   msg.to_user = user
    // }
    return messages;
  }
}


module.exports = User;
