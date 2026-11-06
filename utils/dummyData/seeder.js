import "../../config.js";
import fs from "fs";
import "colors";
import mongoose from "mongoose";
import slugify from "slugify";

import dbConnection from "../../config/database.js";
import User from "../../models/userModel.js";
import Category from "../../models/categoryModel.js";
import Brand from "../../models/brandModel.js";
import Product from "../../models/productModel.js";
import Coupon from "../../models/couponModel.js";

// Shared password of the demo accounts (documented in the README)
const DEMO_PASSWORD = "demo-pass-123";

// Run from the project root (npm run seed)
const demoData = JSON.parse(fs.readFileSync("utils/dummyData/demoData.json"));

const toSlug = (text) => slugify(text, { lower: true, strict: true });

// Insert only what is missing, existing documents are left untouched
const insertIfMissing = (Model, filter, doc) =>
  Model.updateOne(filter, { $setOnInsert: doc }, { upsert: true });

// Insert data into DB (safe to run more than once)
const insertData = async () => {
  await Promise.all(
    demoData.categories.map(({ name, image }) =>
      insertIfMissing(Category, { name }, { name, slug: toSlug(name), image }),
    ),
  );
  await Promise.all(
    demoData.brands.map(({ name }) =>
      insertIfMissing(Brand, { name }, { name, slug: toSlug(name) }),
    ),
  );

  const categories = await Category.find({
    name: { $in: demoData.categories.map(({ name }) => name) },
  });
  const brands = await Brand.find({
    name: { $in: demoData.brands.map(({ name }) => name) },
  });
  const idByName = (docs, name) => docs.find((doc) => doc.name === name)._id;
  const categoryImage = (name) =>
    demoData.categories.find((category) => category.name === name).image;

  await Promise.all(
    demoData.products.map((product) => {
      const slug = toSlug(product.title);
      return insertIfMissing(
        Product,
        { slug },
        {
          ...product,
          slug,
          imageCover: categoryImage(product.category),
          category: idByName(categories, product.category),
          brand: idByName(brands, product.brand),
        },
      );
    }),
  );

  await Promise.all(
    demoData.coupons.map(({ name, discount, validDays }) =>
      insertIfMissing(
        Coupon,
        { name },
        {
          name,
          discount,
          expire: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
        },
      ),
    ),
  );

  // Users go through save() so the password is hashed by the model.
  // Running the seed again restores the demo accounts.
  await Promise.all(
    demoData.users.map(async ({ name, email, role }) => {
      const user = (await User.findOne({ email })) || new User({ email });
      user.set({ name, role, password: DEMO_PASSWORD, active: true });
      await user.save();
    }),
  );

  console.log("Demo data inserted".green.inverse);
};

// Delete only the demo data from DB, never a whole collection
const destroyData = async () => {
  await Promise.all([
    User.deleteMany({
      email: { $in: demoData.users.map(({ email }) => email) },
    }),
    Product.deleteMany({
      slug: { $in: demoData.products.map(({ title }) => toSlug(title)) },
      imageCover: /^demo-/,
    }),
    Category.deleteMany({
      name: { $in: demoData.categories.map(({ name }) => name) },
      image: /^demo-/,
    }),
    Brand.deleteMany({
      name: { $in: demoData.brands.map(({ name }) => name) },
    }),
    Coupon.deleteMany({
      name: { $in: demoData.coupons.map(({ name }) => name) },
    }),
  ]);

  console.log("Demo data destroyed".red.inverse);
};

// npm run seed         >> node seeder.js -i
// npm run seed:destroy >> node seeder.js -d
const run = async () => {
  const action = { "-i": insertData, "-d": destroyData }[process.argv[2]];
  if (!action) {
    console.error("Usage: node utils/dummyData/seeder.js -i | -d");
    process.exit(1);
  }

  await dbConnection();
  console.log(`Using database: ${mongoose.connection.name}`);
  await action();
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
