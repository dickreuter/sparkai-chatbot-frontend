import { IMessage } from "../../../types";
import { v4 } from "uuid";

export const getPromptWithHistory = (prompt: string, history: IMessage[]) => {
  return `Chat history: ${JSON.stringify(history)}\n\n; Prompt: ${prompt}`;
};

export const getExtraInstruction = (history: IMessage[]) => {
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
