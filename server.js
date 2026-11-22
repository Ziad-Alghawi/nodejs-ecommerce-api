import app from "./app.js";
import dbConnection from "./config/database.js";

// Connect to database
dbConnection();

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// Handle rejections outside express
process.on("unhandledRejection", (err) => {
  console.error(`Unhandeled Rejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error("Shutting down...");
    process.exit(1);
  });
});
