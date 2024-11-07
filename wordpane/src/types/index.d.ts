export interface IMessage {
  type: "text" | "image" | "loading";
  value: string;
  createdBy: "user" | "bot";
}

export type IPromptType =
  | "Summarise"
  | "Expand"
  | "Inject Tender Context"
  | "Inject Company Voice"
  | "We will Active Voice"
  | "Graph";

export type IShortcutType = "insert" | "replace" | "refine";
