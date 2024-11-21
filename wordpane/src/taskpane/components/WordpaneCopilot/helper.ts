import { IMessage, IMessageRequest, IPromptType } from "../../../types";
import { v4 } from "uuid";
import { getBase64FromBlob } from "../../helper/file";
import { apiURL } from "../../helper/urls";
import axios from "axios";
import { BID_PILOT_BROADNESS, BID_PILOT_CHOICE, LOCAL_STORAGE_CACHE_VERSION } from "./constants";

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
    prompt: prompt,
    messages: cloned,
  };
};

export const askLibraryChatQuestion = async (token: string, request: IMessageRequest): Promise<IMessage> => {
  try {
    const result = await axios.post(
      apiURL("question"),
      {
        choice: BID_PILOT_CHOICE,
        broadness: BID_PILOT_BROADNESS,
        input_text: request.isRefine
          ? `${request.instructionText};\n\n ${request.refineInstruction}`
          : request.instructionText,
        extra_instructions: normalizeChatHistory(request.messages),
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
      isRefine: request.isRefine,
      request,
    });
  } catch (error) {
    console.error("Error sending question:", error);

    return withId({
      type: "text",
      value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
      createdBy: "bot",
      action: "default",
      isRefine: false,
      request,
    });
  }
};

export const askInternetQuestion = async (token: string, request: IMessageRequest): Promise<IMessage> => {
  try {
    const result = await axios.post(
      apiURL("perplexity"),
      {
        input_text: request.isRefine
          ? `${request.instructionText};\n\n ${request.refineInstruction}`
          : `${request.instructionText}\n\n Respond in a full sentence format.`,
        dataset: "default",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );
    return withId({ createdBy: "bot", type: "text", value: result.data, action: "default", isRefine: false, request });
  } catch (error) {
    console.error("Error sending question:", error);
    // Replace the temporary loading message with the error message
    return withId({
      createdBy: "bot",
      type: "text",
      value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
      action: "default",
      isRefine: request.isRefine,
      request,
    });
  }
};

export const askCopilot = async (token: string, request: IMessageRequest): Promise<IMessage> => {
  localStorage.setItem("questionAsked", "true");
  try {
    const response = await axios.post(
      apiURL("copilot"),
      {
        input_text: request.highlightedText,
        extra_instructions: normalizeChatHistory(request.messages),
        copilot_mode: getCopilotMode(
          request.isRefine ? "Custom Prompt" : request.action,
          request.isRefine ? request.refineInstruction : request.instructionText
        ),
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
      action: request.action,
      isRefine: request.isRefine,
      request,
    });
  } catch (error) {
    console.error("Error sending question:", error);
    return withId({
      type: "text",
      value: "Message failed, please contact support...",
      createdBy: "bot",
      action: request.action,
      isRefine: request.isRefine,
      request,
    });
  }
};

export const askDiagram = async (_token: string, request: IMessageRequest): Promise<IMessage> => {
  localStorage.setItem("questionAsked", "true");

  try {
    const response = await axios.post(
      apiURL("generate_diagram"),
      request.isRefine ? `${request.highlightedText}; ${request.refineInstruction}` : request.highlightedText,
      {
        responseType: "blob",
        timeout: 30000,
      }
    );
    return withId({
      type: "image",
      value: await getBase64FromBlob(response.data),
      createdBy: "bot",
      action: request.action,
      isRefine: request.isRefine,
      request,
    });
  } catch (error) {
    console.error("Error sending question:", error);
    return withId({
      type: "text",
      value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
      createdBy: "bot",
      action: request.action,
      isRefine: request.isRefine,
      request,
    });
  }
};

export const getCopilotMode = (action: IPromptType | "default", prompt: string): string => {
  if (action === "Custom Prompt") {
    return `4${prompt}`;
  } else {
    return `1${action.toLowerCase().replace(/\s+/g, "_")}`;
  }
};

export const getDefaultMessage = (type: "library-chat" | "internet-search", useCache: boolean = false): IMessage[] => {
  const version = localStorage.getItem("version");
  if (version !== LOCAL_STORAGE_CACHE_VERSION) {
    return [];
  }
  const savedMessages = localStorage.getItem(type);

  if (useCache && savedMessages) {
    const parsedMessages: IMessage[] = JSON.parse(savedMessages);
    if (parsedMessages.length > 0) {
      const filtered: IMessage[] = [];
      for (let i = 0; i < parsedMessages.length; i++) {
        const message = parsedMessages[i];
        if (message.createdBy === "user" && parsedMessages?.[i + 1]?.type === "loading") {
          break;
        }
        filtered.push(message);
      }
      return filtered;
    }
  }

  return [];
};

export const setCacheVersion = () => {
  localStorage.setItem("version", LOCAL_STORAGE_CACHE_VERSION);
};
