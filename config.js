// Load .env variables before other imports that use process.env
import dotenv from "dotenv";

// .env is the documented file, config.env is still supported
dotenv.config({ path: [".env", "config.env"] });

// On Render the public URL is provided automatically
if (!process.env.BASE_URI && process.env.RENDER_EXTERNAL_URL) {
  process.env.BASE_URI = process.env.RENDER_EXTERNAL_URL;
}
