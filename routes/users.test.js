"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
let token;
let tokenBill;


describe("Users Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let response = await request(app)
      .post("/auth/register")
      .send({
        username: "bob",
        password: "secret",
        first_name: "Bob",
        last_name: "Smith",
        phone: "+14150000000"
      });
    token = response.body.token;

    let response1 = await request(app)
      .post("/auth/register")
      .send({
        username: "bill",
        password: "secret",
        first_name: "Bill",
        last_name: "Smith",
        phone: "+14150000001"
      });
    tokenBill = response1.body.token;

    let message = await request(app)
      .post("/messages")
      .send({
        from_username: "bob",
        to_username: "bill",
        body: "hello",
        _token: token
      })
    });

  /** POST /auth/register => token  */

  describe("GET /users", function () {
    test("get list of users", async function () {
      let response = await request(app)
        .get("/users")
        .send({
          _token: token
        });

      expect(response.body.users[0].first_name).toEqual("Bob");
      expect(response.body.users[0].last_name).toEqual("Smith");
    });
  });

  describe("GET /:username", function () {
    test("get a user based on username", async function () {
      let response = await request(app)
        .get("/users/bob")
        .send({
          _token: token
        });

      expect(response.body.user.first_name).toEqual("Bob");
      expect(response.body.user.last_name).toEqual("Smith");
    });
  });
  //test for if no token, get 401 response
  //check authorization

  describe("GET /:username/from", function () {
    test("get to messages based on username", async function () {
      let response = await request(app)
        .get("/users/bob/from")
        .send({
          _token: token
        });

      expect(response.body.messages.length).toEqual(1);
      expect(response.body.messages[0].body).toEqual("hello");
    });
  });
 
  describe("GET /:username/to", function () {
    test("get to messages based on username", async function () {
      let response = await request(app)
        .get("/users/bill/to")
        .send({
          _token: tokenBill
        });

      expect(response.body.messages[0].from_user.username).toEqual("bob");
      expect(response.body.messages[0].body).toEqual("hello");
    });
  });
});

afterAll(async function () {
  await db.end();
});
