import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import {
  connectDatabase,
  disconnectDatabase,
  clearDatabase,
  createUser,
} from "./helpers.js";

const { default: app } = await import("../app.js");
const { default: Category } = await import("../models/categoryModel.js");

before(connectDatabase);
after(disconnectDatabase);
beforeEach(clearDatabase);

const as = ({ token }) => ({ Authorization: `Bearer ${token}` });

test("the health route reports the database connection", async () => {
  const res = await request(app).get("/health");

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok", database: "connected" });
});

test("anyone can list categories", async () => {
  await Category.create({ name: "Electronics" });
  const res = await request(app).get("/api/v1/categories");

  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].name, "Electronics");
});

test("only managers and admins can create categories", async () => {
  const user = await createUser();
  const manager = await createUser({ role: "manager" });
  const body = { name: "Books" };

  assert.equal(
    (await request(app).post("/api/v1/categories").send(body)).status,
    401,
  );
  assert.equal(
    (await request(app).post("/api/v1/categories").set(as(user)).send(body))
      .status,
    403,
  );

  const res = await request(app)
    .post("/api/v1/categories")
    .set(as(manager))
    .send(body);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.slug, "books");
});

test("only admins can delete categories", async () => {
  const manager = await createUser({ role: "manager" });
  const admin = await createUser({ role: "admin" });
  const category = await Category.create({ name: "Garden" });
  const url = `/api/v1/categories/${category._id}`;

  assert.equal((await request(app).delete(url).set(as(manager))).status, 403);
  assert.equal((await request(app).delete(url).set(as(admin))).status, 204);
  assert.equal(await Category.countDocuments(), 0);
});

test("an invalid id is refused before it reaches the database", async () => {
  const res = await request(app).get("/api/v1/categories/not-an-id");

  assert.equal(res.status, 400);
});

test("only managers and admins can list users, and the list has no secret fields", async () => {
  const user = await createUser();
  const manager = await createUser({ role: "manager" });

  assert.equal(
    (await request(app).get("/api/v1/users").set(as(user))).status,
    403,
  );

  const res = await request(app).get("/api/v1/users").set(as(manager));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 2);
  res.body.data.forEach((listed) => {
    assert.equal(listed.password, undefined);
    assert.equal(listed.passwordResetCode, undefined);
  });
});

test("managers cannot create users; admins can", async () => {
  const manager = await createUser({ role: "manager" });
  const admin = await createUser({ role: "admin" });
  const body = {
    name: "Created User",
    email: "created@example.com",
    password: "pass-1234",
    passwordConfirm: "pass-1234",
  };

  assert.equal(
    (await request(app).post("/api/v1/users").set(as(manager)).send(body))
      .status,
    403,
  );

  const res = await request(app)
    .post("/api/v1/users")
    .set(as(admin))
    .send(body);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.password, undefined);
});
