// Shared test setup. Import it before app.js, so these settings are in place when the app loads
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server-core";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET_KEY ??= "test-secret-key";
process.env.JWT_EXPIRES_TIME ??= "1h";
process.env.STRIPE_SECRET ??= "sk_test_dummy";
process.env.RATE_LIMIT_SCALE = "1000";

const { default: User } = await import("../models/userModel.js");
const { default: createToken } = await import("../utils/createToken.js");

let memoryServer;

// CI passes a MongoDB service in TEST_DB_URI; locally an in-memory MongoDB is started.
// Each test file gets a database of its own, so the files can run in parallel
export async function connectDatabase() {
  let uri = process.env.TEST_DB_URI;
  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  await mongoose.connect(uri, { dbName: `test-${randomUUID()}` });
  await User.init(); // build the unique email index before the tests use it
}

export async function disconnectDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await memoryServer?.stop();
}

export async function clearDatabase() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

// A user with a role and a token, created directly in the database
export async function createUser({
  role = "user",
  email = `${role}-${randomUUID()}@example.com`,
  password = "pass-1234",
} = {}) {
  const user = await User.create({
    name: `Test ${role}`,
    email,
    password,
    role,
  });
  return { user, email, password, token: createToken(user._id) };
}
