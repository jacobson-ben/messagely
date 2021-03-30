"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const Message = require("../models/message");
let token;
let tokenBill;
let msgId;


describe("Messages Routes Test", function () {
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
    msgId = message.body.message.id;
    
  });

  /** POST /auth/register => token  */

  describe("GET /message/id", function () {
    test("get message based on id", async function () {
      let response = await request(app)
        .get(`/messages/${msgId}`)
        .send({
          _token: token
        });
      
      expect(response.body.message[0].body).toEqual("hello");
      expect(response.body.message[0].from_user.username).toEqual("bob");
    });
  });

  //test for posting a message - 200 response
  //test for authorization

  describe("POST /message/id/read", function () {
    test("test if correct user can read msg", async function () {
      let response = await request(app)
        .get(`/messages/${msgId}/read`)
        .send({
          _token: tokenBill
        });

      expect(response.body.message[0].read_at).toEqual(any(Date()))
    });
  });
});

afterAll(async function () {
  await db.end();
});
