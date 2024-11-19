import { IMessage, IPromptOption, IPromptType } from "../../../types";
import { v4 } from "uuid";
import { getBase64FromBlob } from "../../helper/file";
import { apiURL } from "../../helper/urls";
import axios from "axios";
import { BID_PILOT_BROADNESS, BID_PILOT_CHOICE } from "./constants";

export const getPromptWithHistory = (prompt: string, history: IMessage[]) => {
  return `Chat history: ${JSON.stringify(history)}\n\n; Prompt: ${prompt}`;
};

export const normalizeChatHistory = (history: IMessage[]) => {
  return history.map((msg) => `${msg.createdBy}: ${msg.type === "image" ? "image" : msg.value}`).join("\n");
};

export const removeDoubleBr = (htmlText: string) => {
  const result = htmlText
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")
    .replace(/<\/li><br>/gi, "</li>")
    .replace(/<br><li>/gi, "<li>");
  console.log({ result });
  return result;
};

export const withId = <T>(obj: T): T & { id: string } => {
  return { ...obj, id: v4() };
};

export const formatResponse = (response: string) => {
  // Handle numbered lists
  response = response.replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>");
  if (response.includes("<li>")) {
    response = `<ol>${response}</ol>`;
  }

  // Handle bullet points
  response = response.replace(/^[-•]\s(.+)$/gm, "<li>$1</li>");
  if (response.includes("<li>") && !response.includes("<ol>")) {
    response = `<ul>${response}</ul>`;
  }

  // Handle bold text
  response = response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Handle italic text
  response = response.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Handle newlines for better readability
  response = response.replace(/\n/g, "<br>");

  return response;
};

export const refineResponse = (prompt: string, message: IMessage, history: IMessage[]) => {
  const index = history.findIndex((msg) => msg.id === message.id);
  const cloned = structuredClone(history);

  cloned.splice(index + 1);

  return {
    prompt,
    messages: cloned,
  };
};

export const askLibraryChatQuestion = async (
  token: string,
  question: string,
  messages: IMessage[],
  option: IPromptOption
): Promise<IMessage> => {
  try {
    const result = await axios.post(
      apiURL("question"),
      {
        choice: BID_PILOT_CHOICE,
        broadness: BID_PILOT_BROADNESS,
        input_text: question,
        extra_instructions: normalizeChatHistory(messages),
        datasets: ["default"],
        bid_id: "sharedState.object_id",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );

    const formattedResponse = formatResponse(result.data);
    return withId({
      type: "text",
      value: formattedResponse,
      createdBy: "bot",
      action: "default",
      isRefine: option.isRefine,
    });
  } catch (error) {
    console.error("Error sending question:", error);

    return withId({
      type: "text",
      value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
      createdBy: "bot",
      action: "default",
      isRefine: false,
    });
  }
};

export const askInternetQuestion = async (
  token: string,
  question: string,
  messages: IMessage[],
  option: IPromptOption
): Promise<IMessage> => {
  try {
    const result = await axios.post(
      apiURL("perplexity"),
      {
        input_text: `${question}\n\n Respond in a full sentence format.`,
        dataset: "default",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );
    return withId({ createdBy: "bot", type: "text", value: result.data, action: "default", isRefine: false });
  } catch (error) {
    console.error("Error sending question:", error);
    // Replace the temporary loading message with the error message
    return withId({
      createdBy: "bot",
      type: "text",
      value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
      action: "default",
      isRefine: option.isRefine,
    });
  }
};

export const askCopilot = async (
  token: string,
  text: string,
  promptType: IPromptType,
  copilot_mode: string,
  messages: IMessage[],
  option: IPromptOption
): Promise<IMessage> => {
  localStorage.setItem("questionAsked", "true");
  try {
    const response = await axios.post(
      apiURL("copilot"),
      {
        input_text: text,
        extra_instructions: normalizeChatHistory(messages),
        copilot_mode: copilot_mode,
        datasets: [],
        bid_id: "32212",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );

    return withId({
      type: "text",
      value: response.data,
      createdBy: "bot",
      action: promptType,
      isRefine: option.isRefine,
    });
  } catch (error) {
    console.error("Error sending question:", error);
    return withId({
      type: "text",
      value: "Message failed, please contact support...",
      createdBy: "bot",
      action: promptType,
      isRefine: option.isRefine,
    });
  }
};

export const askDiagram = async (
  _token: string,
  text: string,
  promptType: IPromptType,
  messages: IMessage[],
  option: IPromptOption
): Promise<IMessage> => {
  localStorage.setItem("questionAsked", "true");

  try {
    const response = await axios.post(apiURL("generate_diagram"), text, {
      responseType: "blob",
      timeout: 30000,
    });
    return withId({
      type: "image",
      value: await getBase64FromBlob(response.data),
      createdBy: "bot",
      action: promptType,
      isRefine: option.isRefine,
    });
  } catch (error) {
    console.error("Error sending question:", error);
    return withId({
      type: "text",
      value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
      createdBy: "bot",
      action: promptType,
      isRefine: option.isRefine,
    });
  }
};
