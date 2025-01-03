import { describe, it, expect, beforeAll } from "vitest";
import { getAuthenticatedAxios } from "../../test/setup";

const authenticatedAxios = await getAuthenticatedAxios();

describe("Quick Question", () => {
  it("sends question and receives response from API", async () => {
    const questionResponse = await authenticatedAxios.post(
      `https://dev.mytender.io:7861/question`,
      {
        choice: "2",
        broadness: "2",
        input_text: "Test question",
        extra_instructions: "user: Previous question\nbot: Previous answer",
        datasets: ["default"]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    // Log response for debugging
    console.log("API Response status:", questionResponse.status);
    console.log("Response data:", questionResponse.data);

    // Basic assertions on the API response
    expect(questionResponse.status).toBe(200);
    expect(typeof questionResponse.data).toBe("string");
  });
});
