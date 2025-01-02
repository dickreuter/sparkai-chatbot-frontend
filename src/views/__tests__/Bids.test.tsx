import { describe, it, expect, beforeAll, vi } from "vitest";
import axios from "axios";

async function getAuthToken() {
  try {
    console.log(process.env.TEST_USERNAME);
    console.log(process.env.TEST_PASSWORD);
    const response = await axios.post(`https://dev.mytender.io:7861/login`, {
      email: process.env.TEST_USERNAME,
      password: process.env.TEST_PASSWORD
    });
   
    console.log("Login response:", {
      status: response.status,
      token: response.data.access_token
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
}

describe("Bids Component", () => {
  let authToken: string;

  beforeAll(async () => {
    authToken = await getAuthToken();
    console.log("Auth token obtained:", !!authToken);
  });

  it("fetches bids from API", async () => {
    // Test the API call directly
    const bidsResponse = await axios.post(
      `https://dev.mytender.io:7861/get_bids_list/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Log response for debugging
    console.log("API Response status:", bidsResponse.status);
    console.log("Number of bids:", bidsResponse.data.bids?.length || 0);

    // Basic assertion on the API response
    expect(bidsResponse.status).toBe(200);
    expect(bidsResponse.data).toHaveProperty("bids");
    expect(Array.isArray(bidsResponse.data.bids)).toBe(true);
  });
});
