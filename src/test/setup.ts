import { config } from "dotenv";
import { resolve } from "path";

// Load the .env.test file
// Load environment variables from .env.test if running locally
if (!process.env.CI) {
  config({ path: resolve(__dirname, "../../.env.test") });
}
