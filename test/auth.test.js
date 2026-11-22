import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import request from "supertest";

import {
  connectDatabase,
  disconnectDatabase,
  clearDatabase,
  createUser,
} from "./helpers.js";

const { default: app } = await import("../app.js");
const { default: User } = await import("../models/userModel.js");

before(connectDatabase);
after(disconnectDatabase);
beforeEach(clearDatabase);

const SECRET_FIELDS = ["password", "passwordResetCode", "passwordResetExpires"];

// Gives the user a known reset code, as if they had asked for one by email
async function setResetCode(
  user,
  code = "123456",
  expiresInMs = 10 * 60 * 1000,
) {
  await User.updateOne(
    { _id: user._id },
    {
      passwordResetCode: crypto.createHash("sha256").update(code).digest("hex"),
      passwordResetExpires: Date.now() + expiresInMs,
      passwordResetAttempts: 0,
    },
  );
}

const verifyCode = (email, resetCode) =>
  request(app).post("/api/v1/auth/verifyResetCode").send({ email, resetCode });

const resetPassword = (body) =>
  request(app).put("/api/v1/auth/resetpassword").send(body);

const login = (email, password) =>
  request(app).post("/api/v1/auth/login").send({ email, password });

test("signup returns a token and no secret fields, and stores a hashed password", async () => {
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: "New User",
    email: "new@example.com",
    password: "pass-1234",
    passwordConfirm: "pass-1234",
  });

  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.data.email, "new@example.com");
  SECRET_FIELDS.forEach((field) =>
    assert.equal(res.body.data[field], undefined),
  );

  const stored = await User.findOne({ email: "new@example.com" }).select(
    "+password",
  );
  assert.notEqual(stored.password, "pass-1234");
});

test("signup refuses an email that is already in use", async () => {
  const { email } = await createUser();
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: "Second User",
    email,
    password: "pass-1234",
    passwordConfirm: "pass-1234",
  });

  assert.equal(res.status, 400);
});

test("login works with the right password only", async () => {
  const { email, password } = await createUser();

  assert.equal((await login(email, "wrong-password")).status, 401);
  assert.equal((await login("nobody@example.com", password)).status, 401);

  const res = await login(email, password);
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test("a protected route needs a valid token and never returns secret fields", async () => {
  const { email, token } = await createUser();

  assert.equal((await request(app).get("/api/v1/users/getMe")).status, 401);
  assert.equal(
    (
      await request(app)
        .get("/api/v1/users/getMe")
        .set("Authorization", "Bearer not-a-token")
    ).status,
    401,
  );

  const res = await request(app)
    .get("/api/v1/users/getMe")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.email, email);
  SECRET_FIELDS.forEach((field) =>
    assert.equal(res.body.data[field], undefined),
  );
});

test("a deactivated account's token stops working", async () => {
  const { token } = await createUser();
  const auth = { Authorization: `Bearer ${token}` };

  assert.equal(
    (await request(app).delete("/api/v1/users/deleteMe").set(auth)).status,
    204,
  );
  assert.equal(
    (await request(app).get("/api/v1/users/getMe").set(auth)).status,
    401,
  );
});

test("forgot password gives the same answer for unknown and known emails", async () => {
  const { user, email } = await createUser();

  const unknown = await request(app)
    .post("/api/v1/auth/forgotpassword")
    .send({ email: "nobody@example.com" });
  const known = await request(app)
    .post("/api/v1/auth/forgotpassword")
    .send({ email });

  assert.equal(unknown.status, 200);
  assert.equal(known.status, 200);
  assert.deepEqual(unknown.body, known.body);

  const stored = await User.findById(user._id).select(
    "+passwordResetCode +passwordResetExpires",
  );
  assert.match(stored.passwordResetCode, /^[0-9a-f]{64}$/); // stored hashed, not as the code
  assert.ok(stored.passwordResetExpires > Date.now());
});

test("a reset code only works with the email it was sent to", async () => {
  const alice = await createUser();
  const bob = await createUser();
  await setResetCode(alice.user);

  assert.equal((await verifyCode(bob.email, "123456")).status, 400);
  assert.equal(
    (
      await resetPassword({
        email: bob.email,
        resetCode: "123456",
        newPassword: "taken-over",
      })
    ).status,
    400,
  );
  assert.equal((await verifyCode(alice.email, "123456")).status, 200);
});

test("setting a new password needs the reset code, even after the code was verified", async () => {
  const { user, email, password } = await createUser();
  await setResetCode(user);
  assert.equal((await verifyCode(email, "123456")).status, 200);

  // Knowing the email is not enough once someone verified the code
  assert.equal(
    (await resetPassword({ email, newPassword: "taken-over" })).status,
    400,
  );
  assert.equal(
    (
      await resetPassword({
        email,
        resetCode: "654321",
        newPassword: "taken-over",
      })
    ).status,
    400,
  );

  const res = await resetPassword({
    email,
    resetCode: "123456",
    newPassword: "new-pass-123",
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal((await login(email, "new-pass-123")).status, 200);
  assert.equal((await login(email, password)).status, 401);
});

test("a reset code can be used once", async () => {
  const { user, email } = await createUser();
  await setResetCode(user);

  assert.equal(
    (
      await resetPassword({
        email,
        resetCode: "123456",
        newPassword: "new-pass-123",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await resetPassword({
        email,
        resetCode: "123456",
        newPassword: "again-pass-123",
      })
    ).status,
    400,
  );
});

test("an expired reset code is refused", async () => {
  const { user, email } = await createUser();
  await setResetCode(user, "123456", -1000);

  assert.equal((await verifyCode(email, "123456")).status, 400);
  assert.equal(
    (
      await resetPassword({
        email,
        resetCode: "123456",
        newPassword: "new-pass-123",
      })
    ).status,
    400,
  );
});

test("reset codes must be six digits", async () => {
  const { email } = await createUser();

  assert.equal((await verifyCode(email, "12345")).status, 400);
  assert.equal((await verifyCode(email, "abcdef")).status, 400);
  assert.equal((await verifyCode(email, { $ne: null })).status, 400);
});

test("four wrong codes still leave the right one working", async () => {
  const { user, email } = await createUser();
  await setResetCode(user);

  for (let i = 0; i < 4; i += 1) {
    assert.equal((await verifyCode(email, "000000")).status, 400);
  }
  assert.equal((await verifyCode(email, "123456")).status, 200);
});

test("five wrong codes use the reset code up, even when sent at the same time", async () => {
  const { user, email } = await createUser();
  await setResetCode(user);

  const guesses = await Promise.all(
    ["000000", "111111", "222222", "333333", "444444"].map((code) =>
      verifyCode(email, code),
    ),
  );
  guesses.forEach((res) => assert.equal(res.status, 400));

  assert.equal((await verifyCode(email, "123456")).status, 400);
  assert.equal(
    (
      await resetPassword({
        email,
        resetCode: "123456",
        newPassword: "new-pass-123",
      })
    ).status,
    400,
  );
});
