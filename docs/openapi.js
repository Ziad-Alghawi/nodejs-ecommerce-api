// OpenAPI 3 description of the API, served by Swagger UI at /api-docs

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const pathParam = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string" },
});

const listParams = ["page", "limit", "sort", "fields", "keyword"].map(
  (name) => ({ $ref: `#/components/parameters/${name}` }),
);

// OpenAPI does not allow an empty "required" list
const objectSchema = (properties, required) => ({
  type: "object",
  properties,
  ...(required.length && { required }),
});

const jsonBody = (properties, required = [], example = undefined) => ({
  required: required.length > 0,
  content: {
    "application/json": {
      schema: objectSchema(properties, required),
      ...(example && { example }),
    },
  },
});

const formBody = (properties, required = []) => ({
  required: required.length > 0,
  content: {
    "multipart/form-data": { schema: objectSchema(properties, required) },
  },
});

const errorResponse = (description) => ({
  description,
  content: { "application/json": { schema: ref("Error") } },
});

const errors = {
  400: errorResponse("Invalid input"),
  401: errorResponse("Missing, invalid or expired token"),
  403: errorResponse("Your role is not allowed to do this"),
  404: errorResponse("Not found"),
  429: {
    description: "Too many requests",
    content: { "text/plain": { schema: { type: "string" } } },
  },
};

// Build an operation.
// roles: undefined = public, [] = any logged-in user, ["admin"] = that role only
const op = (
  tag,
  summary,
  { roles, params = [], body, status = 200, schema, description, codes = [] } = {},
) => {
  const isPrivate = roles !== undefined;
  const access = isPrivate
    ? `Access: ${roles.length ? roles.join(", ") : "any logged-in user"}.`
    : "Access: public.";
  const content = schema
    ? { "application/json": { schema: ref(schema) } }
    : undefined;
  const errorCodes = [
    ...codes,
    ...(isPrivate ? [401] : []),
    ...(isPrivate && roles.length ? [403] : []),
  ];

  return {
    tags: [tag],
    summary,
    description: [description, access].filter(Boolean).join("\n\n"),
    ...(isPrivate && { security: [{ bearerAuth: [] }] }),
    ...(params.length && { parameters: params }),
    ...(body && { requestBody: body }),
    responses: {
      [status]: { description: "Success", ...(content && { content }) },
      ...Object.fromEntries(errorCodes.map((code) => [code, errors[code]])),
    },
  };
};

const str = { type: "string" };
const num = { type: "number" };
const file = { type: "string", format: "binary" };

const staff = ["admin", "manager"];
const admin = ["admin"];
const user = ["user"];

// GET list + POST create + GET one + PUT update + DELETE for a catalog resource
const crud = (tag, label, path, { createBody, updateBody, schema }) => ({
  [path]: {
    get: op(tag, `List ${label}s`, { params: listParams, codes: [400] }),
    post: op(tag, `Create a ${label}`, {
      roles: staff,
      body: createBody,
      status: 201,
      schema,
      codes: [400],
    }),
  },
  [`${path}/{id}`]: {
    get: op(tag, `Get a ${label}`, {
      params: [pathParam("id", `${label} ID`)],
      schema,
      codes: [400, 404],
    }),
    put: op(tag, `Update a ${label}`, {
      roles: staff,
      params: [pathParam("id", `${label} ID`)],
      body: updateBody,
      schema,
      codes: [400, 404],
    }),
    delete: op(tag, `Delete a ${label}`, {
      roles: admin,
      params: [pathParam("id", `${label} ID`)],
      status: 204,
      codes: [400, 404],
    }),
  },
});

const nameAndImage = { name: str, image: file };
const productFields = {
  title: str,
  description: str,
  quantity: num,
  price: num,
  priceAfterDiscount: num,
  colors: { type: "array", items: str },
  imageCover: file,
  images: { type: "array", items: file },
  category: { ...str, description: "Category ID" },
  subcategories: { type: "array", items: str },
  brand: { ...str, description: "Brand ID" },
};
const shippingAddress = {
  type: "object",
  properties: { details: str, phone: str, city: str, postalCode: str },
};
const passwordChange = jsonBody(
  { currentPassword: str, password: str, passwordConfirm: str },
  ["currentPassword", "password", "passwordConfirm"],
);
const couponFields = {
  name: str,
  expire: { type: "string", format: "date" },
  discount: { type: "number", minimum: 0, maximum: 100 },
};

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "E-Commerce REST API",
    version: "1.0.0",
    description:
      "REST API for an online shop. Log in with `POST /auth/login`, copy the `token` from the response, then click **Authorize** and paste it.\n\nDemo accounts are listed in the README after running `npm run seed`.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Categories" },
    { name: "Subcategories" },
    { name: "Brands" },
    { name: "Products" },
    { name: "Reviews" },
    { name: "Wishlist" },
    { name: "Addresses" },
    { name: "Coupons" },
    { name: "Cart" },
    { name: "Orders" },
    { name: "System" },
  ],
  paths: {
    // Auth
    "/auth/signup": {
      post: op("Auth", "Create an account", {
        body: jsonBody(
          { name: str, email: str, password: str, passwordConfirm: str },
          ["name", "email", "password", "passwordConfirm"],
          {
            name: "New User",
            email: "new.user@example.com",
            password: "demo-pass-123",
            passwordConfirm: "demo-pass-123",
          },
        ),
        status: 201,
        schema: "AuthResponse",
        codes: [400, 429],
      }),
    },
    "/auth/login": {
      post: op("Auth", "Log in and get a token", {
        body: jsonBody({ email: str, password: str }, ["email", "password"], {
          email: "user@example.com",
          password: "demo-pass-123",
        }),
        schema: "AuthResponse",
        codes: [400, 429],
      }),
    },
    "/auth/forgotpassword": {
      post: op("Auth", "Email a 6-digit reset code", {
        body: jsonBody({ email: str }, ["email"]),
        codes: [400, 404, 429],
      }),
    },
    "/auth/verifyResetCode": {
      post: op("Auth", "Verify the reset code", {
        body: jsonBody({ resetCode: str }, ["resetCode"]),
        codes: [400, 429],
      }),
    },
    "/auth/resetpassword": {
      put: op("Auth", "Set a new password after verifying the code", {
        body: jsonBody({ email: str, newPassword: str }, [
          "email",
          "newPassword",
        ]),
        codes: [400, 404, 429],
      }),
    },

    // Users
    "/users/getMe": {
      get: op("Users", "Get my profile", { roles: [], schema: "UserResponse" }),
    },
    "/users/changeMyPassword": {
      put: op("Users", "Change my password", {
        roles: [],
        body: passwordChange,
        schema: "AuthResponse",
        codes: [400],
      }),
    },
    "/users/updateMe": {
      put: op("Users", "Update my profile", {
        roles: [],
        body: jsonBody({ name: str, email: str, phone: str }, ["email"]),
        codes: [400],
      }),
    },
    "/users/deleteMe": {
      delete: op("Users", "Deactivate my account", { roles: [], status: 204 }),
    },
    "/users/changePassword/{id}": {
      put: op("Users", "Change a user's password", {
        roles: staff,
        params: [pathParam("id", "User ID")],
        body: passwordChange,
        codes: [400, 404],
      }),
    },
    "/users": {
      get: op("Users", "List users", {
        roles: staff,
        params: listParams,
        codes: [400],
      }),
      post: op("Users", "Create a user", {
        roles: admin,
        body: formBody(
          {
            name: str,
            email: str,
            password: str,
            passwordConfirm: str,
            phone: str,
            role: { type: "string", enum: ["user", "manager", "admin"] },
            profileImage: file,
          },
          ["name", "email", "password", "passwordConfirm"],
        ),
        status: 201,
        schema: "UserResponse",
        codes: [400],
      }),
    },
    "/users/{id}": {
      get: op("Users", "Get a user", {
        roles: staff,
        params: [pathParam("id", "User ID")],
        schema: "UserResponse",
        codes: [400, 404],
      }),
      put: op("Users", "Update a user", {
        roles: admin,
        params: [pathParam("id", "User ID")],
        body: formBody(
          {
            name: str,
            email: str,
            phone: str,
            role: { type: "string", enum: ["user", "manager", "admin"] },
            profileImage: file,
          },
          ["email"],
        ),
        codes: [400, 404],
      }),
      delete: op("Users", "Delete a user", {
        roles: admin,
        params: [pathParam("id", "User ID")],
        status: 204,
        codes: [400, 404],
      }),
    },

    // Catalog
    ...crud("Categories", "category", "/categories", {
      createBody: formBody(nameAndImage, ["name"]),
      updateBody: formBody(nameAndImage),
    }),
    "/categories/{categoryId}/subcategories": {
      get: op("Subcategories", "List the subcategories of a category", {
        params: [pathParam("categoryId", "Category ID"), ...listParams],
      }),
      post: op("Subcategories", "Create a subcategory in a category", {
        roles: staff,
        params: [pathParam("categoryId", "Category ID")],
        body: jsonBody({ name: str }, ["name"]),
        status: 201,
        codes: [400],
      }),
    },
    ...crud("Subcategories", "subcategory", "/subCategories", {
      createBody: jsonBody({ name: str, category: str }, ["name", "category"]),
      updateBody: jsonBody({ name: str, category: str }, ["name"]),
    }),
    ...crud("Brands", "brand", "/brands", {
      createBody: formBody(nameAndImage, ["name"]),
      updateBody: formBody(nameAndImage),
    }),
    ...crud("Products", "product", "/products", {
      createBody: formBody(productFields, [
        "title",
        "description",
        "quantity",
        "price",
        "imageCover",
        "category",
      ]),
      updateBody: formBody(productFields),
    }),

    // Reviews
    "/reviews": {
      get: op("Reviews", "List reviews", { params: listParams }),
      post: op("Reviews", "Create a review", {
        roles: user,
        body: jsonBody({ title: str, ratings: num, product: str }, [
          "ratings",
          "product",
        ]),
        status: 201,
        description: "One review per user and product.",
        codes: [400],
      }),
    },
    "/reviews/{id}": {
      get: op("Reviews", "Get a review", {
        params: [pathParam("id", "Review ID")],
        codes: [400, 404],
      }),
      put: op("Reviews", "Update my review", {
        roles: user,
        params: [pathParam("id", "Review ID")],
        body: jsonBody({ title: str, ratings: num }),
        codes: [400, 404],
      }),
      delete: op("Reviews", "Delete a review", {
        roles: ["user", ...staff],
        params: [pathParam("id", "Review ID")],
        status: 204,
        description: "Users can only delete their own reviews.",
        codes: [400, 404],
      }),
    },
    "/products/{productId}/reviews": {
      get: op("Reviews", "List the reviews of a product", {
        params: [pathParam("productId", "Product ID"), ...listParams],
      }),
      post: op("Reviews", "Review a product", {
        roles: user,
        params: [pathParam("productId", "Product ID")],
        body: jsonBody({ title: str, ratings: num }, ["ratings"]),
        status: 201,
        codes: [400],
      }),
    },
    "/products/{productId}/reviews/{id}": {
      get: op("Reviews", "Get a review of a product", {
        params: [
          pathParam("productId", "Product ID"),
          pathParam("id", "Review ID"),
        ],
        codes: [400, 404],
      }),
    },

    // Wishlist
    "/wishlist": {
      get: op("Wishlist", "Get my wishlist", { roles: user }),
      post: op("Wishlist", "Add a product to my wishlist", {
        roles: user,
        body: jsonBody({ productId: str }, ["productId"]),
        codes: [400],
      }),
    },
    "/wishlist/{productId}": {
      delete: op("Wishlist", "Remove a product from my wishlist", {
        roles: user,
        params: [pathParam("productId", "Product ID")],
        codes: [400],
      }),
    },

    // Addresses
    "/addresses": {
      get: op("Addresses", "Get my addresses", { roles: user }),
      post: op("Addresses", "Add an address", {
        roles: user,
        body: jsonBody({
          alias: str,
          details: str,
          phone: str,
          city: str,
          postalCode: str,
        }),
        codes: [400],
      }),
    },
    "/addresses/{addressId}": {
      delete: op("Addresses", "Remove an address", {
        roles: user,
        params: [pathParam("addressId", "Address ID")],
        codes: [400],
      }),
    },

    // Coupons
    "/coupons": {
      get: op("Coupons", "List coupons", { roles: staff, params: listParams }),
      post: op("Coupons", "Create a coupon", {
        roles: staff,
        body: jsonBody(couponFields, ["name", "expire", "discount"], {
          name: "SUMMER20",
          expire: "2030-12-31",
          discount: 20,
        }),
        status: 201,
        codes: [400],
      }),
    },
    "/coupons/{id}": {
      get: op("Coupons", "Get a coupon", {
        roles: staff,
        params: [pathParam("id", "Coupon ID")],
        codes: [400, 404],
      }),
      put: op("Coupons", "Update a coupon", {
        roles: staff,
        params: [pathParam("id", "Coupon ID")],
        body: jsonBody(couponFields),
        codes: [400, 404],
      }),
      delete: op("Coupons", "Delete a coupon", {
        roles: admin,
        params: [pathParam("id", "Coupon ID")],
        status: 204,
        codes: [400, 404],
      }),
    },

    // Cart
    "/cart": {
      get: op("Cart", "Get my cart", { roles: user, codes: [404] }),
      post: op("Cart", "Add a product to my cart", {
        roles: user,
        body: jsonBody({ productId: str, color: str }, ["productId"]),
        codes: [400],
      }),
      delete: op("Cart", "Clear my cart", { roles: user, status: 204 }),
    },
    "/cart/applyCoupon": {
      put: op("Cart", "Apply a coupon to my cart", {
        roles: user,
        body: jsonBody({ coupon: str }, ["coupon"], { coupon: "DEMO10" }),
        codes: [400, 404],
      }),
    },
    "/cart/{itemId}": {
      put: op("Cart", "Change the quantity of a cart item", {
        roles: user,
        params: [pathParam("itemId", "Cart item ID")],
        body: jsonBody({ quantity: { type: "integer", minimum: 1 } }, [
          "quantity",
        ]),
        codes: [400, 404],
      }),
      delete: op("Cart", "Remove a cart item", {
        roles: user,
        params: [pathParam("itemId", "Cart item ID")],
        codes: [400],
      }),
    },

    // Orders
    "/orders": {
      get: op("Orders", "List orders", {
        roles: ["user", ...staff],
        params: listParams,
        description: "Users only see their own orders.",
      }),
    },
    "/orders/checkout-session/{cartId}": {
      get: op("Orders", "Create a Stripe Checkout session", {
        roles: user,
        params: [pathParam("cartId", "ID of my cart")],
        description:
          "Returns a Stripe Checkout session. The order is created by the Stripe webhook after payment.",
        codes: [400, 404],
      }),
    },
    "/orders/{id}": {
      post: op("Orders", "Create a cash order from my cart", {
        roles: user,
        params: [pathParam("id", "ID of my cart")],
        body: jsonBody({ shippingAddress }),
        status: 201,
        codes: [400, 404],
      }),
      get: op("Orders", "Get an order", {
        roles: ["user", ...staff],
        params: [pathParam("id", "Order ID")],
        description: "Users can only open their own orders.",
        codes: [400, 404],
      }),
    },
    "/orders/{id}/pay": {
      put: op("Orders", "Mark an order as paid", {
        roles: staff,
        params: [pathParam("id", "Order ID")],
        codes: [400, 404],
      }),
    },
    "/orders/{id}/deliver": {
      put: op("Orders", "Mark an order as delivered", {
        roles: staff,
        params: [pathParam("id", "Order ID")],
        codes: [400, 404],
      }),
    },

    // Outside /api/v1
    "/health": {
      servers: [{ url: "/" }],
      get: op("System", "Health check", {
        description: "Returns 503 when the database is not connected.",
      }),
    },
    "/webhook-checkout": {
      servers: [{ url: "/" }],
      post: op("System", "Stripe webhook", {
        description:
          "Called by Stripe, verified with the `stripe-signature` header.",
        codes: [400],
      }),
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    parameters: {
      page: {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1 },
      },
      limit: {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 50 },
      },
      sort: {
        name: "sort",
        in: "query",
        description: "Comma-separated fields, prefix with - for descending",
        schema: str,
        example: "-price",
      },
      fields: {
        name: "fields",
        in: "query",
        description: "Comma-separated fields to return",
        schema: str,
        example: "title,price",
      },
      keyword: {
        name: "keyword",
        in: "query",
        description: "Text search",
        schema: str,
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { status: str, message: str },
      },
      User: {
        type: "object",
        properties: {
          _id: str,
          name: str,
          email: str,
          phone: str,
          profileImage: str,
          role: { type: "string", enum: ["user", "manager", "admin"] },
          active: { type: "boolean" },
        },
      },
      UserResponse: {
        type: "object",
        properties: { data: ref("User") },
      },
      AuthResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: { _id: str, name: str, email: str },
          },
          token: str,
        },
      },
    },
  },
};

export default openApiSpec;
