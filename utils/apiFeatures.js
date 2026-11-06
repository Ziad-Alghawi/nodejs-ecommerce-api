import { SENSITIVE_USER_FIELDS } from "./sanitizeData.js";

// Drop client-supplied Mongo operators ($where, $ne, ...) and secret fields
const stripUnsafeKeys = (value) => {
  if (Array.isArray(value)) return value.map(stripUnsafeKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) => !key.startsWith("$") && !SENSITIVE_USER_FIELDS.includes(key),
      )
      .map(([key, val]) => [key, stripUnsafeKeys(val)]),
  );
};

// Treat the search keyword as plain text, not as a regular expression
const escapeRegex = (text) =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryStringObj = { ...this.queryString };
    const excludesFields = ["page", "sort", "limit", "fields", "keyword"];
    excludesFields.forEach((field) => delete queryStringObj[field]);

    // Apply filtering for gte, gt, lte, lt
    let queryStr = JSON.stringify(stripUnsafeKeys(queryStringObj));
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Build the query
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = String(this.queryString.sort).split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      // title,ratingsAverage,imageCover,price => "title ratingsAverage imageCover price"
      const fields = String(this.queryString.fields).split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  search(modelName) {
    if (this.queryString.keyword) {
      const keyword = escapeRegex(this.queryString.keyword);
      let query = {};
      if (modelName === "Product") {
        query.$or = [
          { title: { $regex: keyword, $options: "i" } }, //$options: "i"
          { description: { $regex: keyword, $options: "i" } },
        ];
      } else {
        query = { name: { $regex: keyword, $options: "i" } };
      }
      this.mongooseQuery = this.mongooseQuery.find(query);
    }
    return this;
  }

  paginate(countDocuments) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit; //(2-1)*5=5
    const endIndex = page * limit; // page 2 => 2*5=10

    // Paginatopn result
    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocuments / limit);

    // next page
    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }
    // previous page
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    this.paginationResult = pagination;
    return this;
  }
}

export default ApiFeatures;
