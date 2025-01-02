import { config } from "dotenv";
import { resolve } from "path";
import { beforeAll, afterAll } from "vitest";
import axios from "axios";

// Load environment variables from .env.test if running locally
if (!process.env.CI) {
  config({ path: resolve(__dirname, "../../.env.test") });
}

// Auth token caching
let cachedAuthToken: string | null = null;

export async function getAuthToken() {
  if (cachedAuthToken) {
    return cachedAuthToken;
  }

  try {
    const response = await axios.post(`https://dev.mytender.io:7861/login`, {
      email: process.env.TEST_USERNAME,
      password: process.env.TEST_PASSWORD
    });

    cachedAuthToken = response.data.access_token;
    return cachedAuthToken;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
}

export function clearAuthToken() {
  cachedAuthToken = null;
}

export async function getAuthenticatedAxios() {
  const token = await getAuthToken();
  return axios.create({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

// Global setup
beforeAll(async () => {
  await getAuthToken();
});

afterAll(() => {
  clearAuthToken();
});
