import { check, body } from "express-validator";
import slugify from "slugify";
import validatorMiddleware from "../../middlewares/validatorMiddleware.js";
import Category from "../../models/categoryModel.js";
import SubCategory from "../../models/subCategoryModel.js";

export const createProductValidator = [
  check("title")
    .isLength({ min: 3 })
    .withMessage("Product title must be at least 3 characters long")
    .notEmpty()
    .withMessage("Product title is required")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 2000 })
    .withMessage("Product description must be less than 2000 characters"),

  check("quantity")
    .notEmpty()
    .withMessage("Product quantity is required")
    .isNumeric()
    .withMessage("Product quantity must be a number"),
  check("sold")
    .optional()
    .isNumeric()
    .withMessage("Product sold must be a number"),

  check("price")
    .notEmpty()
    .withMessage("Product price is required")
    .isNumeric()
    .withMessage("Product price must be a number")
    .isLength({ max: 32 })
    .withMessage("Product price must be less than 32 characters"),

  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Product price after discount must be a number")
    .isFloat()

    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error(
          "Product price after discount must be less than product price",
        );
      }
      return true;
    }),

  check("colors")
    .optional()
    .isArray()
    .withMessage("Product colors must be an array of strings"),

  check("imageCover").notEmpty().withMessage("Product image cover is required"),

  check("images")
    .optional()
    .isArray()
    .withMessage("Product images must be an array of strings"),

  check("category")
    .notEmpty()
    .withMessage("Product must belong to a category")
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`Category not found for ID ${categoryId}`),
          );
        }
      }),
    ),

  body("subCategories")
    .optional()
    .custom((val, { req }) => {
      req.body.subcategories = val;
      return true;
    }),

  check("subcategories")
    .optional()
    .isArray()
    .withMessage("Subcategories must be an array of IDs")
    .custom((subcategoriesIds) =>
      SubCategory.find({ _id: { $exists: true, $in: subcategoriesIds } }).then(
        (result) => {
          // check the length result equal subcategories in body
          if (result.length < 1 || result.length !== subcategoriesIds.length) {
            return Promise.reject(new Error("Invalid subcategories IDs"));
          }
        },
      ),
    )
    .custom((val) => {
      if (new Set(val).size !== val.length) {
        return Promise.reject(new Error("Subcategories must not contain duplicates"));
      }
      return true;
    })
    .custom((val, { req }) =>
      SubCategory.find({ category: req.body.category }).then(
        (subcategories) => {
          const subCategoriesIdsInDB = [];
          subcategories.forEach((subCategory) => {
            subCategoriesIdsInDB.push(subCategory._id.toString());
          });
          // check if every subcategory in body exist in DB and belong to category in body
          const checker = (target, arr) => target.every((v) => arr.includes(v));
          if (!checker(val, subCategoriesIdsInDB)) {
            return Promise.reject(
              new Error(`Subcategories not belong to category`),
            );
          }
        },
      ),
    ),

  check("subcategories.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid subcategory ID"),

  check("brand").optional().isMongoId().withMessage("Invalid brand ID"),

  check("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("Product ratings average must be a number")
    .isLength({ min: 1, max: 5 })
    .withMessage("Product ratings average must be between 1 and 5"),

  check("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("Product ratings quantity must be a number"),

  validatorMiddleware,
];

export const getProductValidator = [
  check("id").isMongoId().withMessage("Invalid product ID"),
  validatorMiddleware,
];

export const updateProductValidator = [
  check("id").isMongoId().withMessage("Invalid product ID"),
  body("title")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

export const deleteProductValidator = [
  check("id").isMongoId().withMessage("Invalid product ID"),
  validatorMiddleware,
];
