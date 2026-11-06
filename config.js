// Load .env variables before other imports that use process.env
import dotenv from "dotenv";

// .env is the documented file, config.env is still supported
dotenv.config({ path: [".env", "config.env"] });
