import { describe, it, expect } from "vitest";
import { getAuthenticatedAxios } from "../../test/setup";

const authenticatedAxios = await getAuthenticatedAxios();

describe("QA Generator Component", () => {
  it("sends a question to the library chat API", async () => {
    const questionResponse = await authenticatedAxios.post(
      `https://dev.mytender.io:7861/question`,
      {
        choice: "2",
        broadness: "4",
        input_text: "What are the key features of our products?",
        extra_instructions: "",
        datasets: ["default"],
        bid_id: ""
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

    // Basic assertions
    expect(questionResponse.status).toBe(200);
    expect(typeof questionResponse.data).toBe("string");
  }, 15000); // Increased timeout to 15 seconds

  it("sends a multi-step question to generate subsections", async () => {
    const multistepResponse = await authenticatedAxios.post(
      `https://dev.mytender.io:7861/question_multistep`,
      {
        choice: "3b",
        broadness: "4",
        input_text: "Describe our company's sustainability initiatives",
        extra_instructions: "",
        selected_choices: ["Environmental Impact", "Social Responsibility"],
        datasets: ["default"],
        word_amounts: ["250", "250"],
        compliance_requirements: ["", ""],
        bid_id: ""
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Log response for debugging
    console.log("API Response status:", multistepResponse.status);
    console.log("Response data:", multistepResponse.data);

    // Basic assertions
    expect(multistepResponse.status).toBe(200);
    expect(typeof multistepResponse.data).toBe("string");
  }, 15000); // Increased timeout to 15 seconds

  it("uses copilot to refine text", async () => {
    const copilotResponse = await authenticatedAxios.post(
      `https://dev.mytender.io:7861/copilot`,
      {
        input_text: "Our company provides excellent service.",
        extra_instructions: "",
        copilot_mode: "1expand",
        datasets: [],
        bid_id: ""
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Log response for debugging
    console.log("API Response status:", copilotResponse.status);
    console.log("Response data:", copilotResponse.data);

    // Basic assertions
    expect(copilotResponse.status).toBe(200);
    expect(typeof copilotResponse.data).toBe("string");
  }, 10000); // Added 10 second timeout

  it("performs an internet search using perplexity", async () => {
    const perplexityResponse = await authenticatedAxios.post(
      `https://dev.mytender.io:7861/perplexity`,
      {
        input_text: "What are the latest trends in renewable energy?",
        dataset: "default"
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Log response for debugging
    console.log("API Response status:", perplexityResponse.status);
    console.log("Response data:", perplexityResponse.data);

    // Basic assertions
    expect(perplexityResponse.status).toBe(200);
    expect(typeof perplexityResponse.data).toBe("string");
  }, 30000); // Keep 30 second timeout for internet search
});
