export interface IMessage {
  type: "text" | "image" | "loading";
  value: string;
  createdBy: "user" | "bot";
}

export type IPromptType =
  | "Summarise"
  | "Expand"
  | "Inject Tender Content"
  | "Inject Tone-of-Voice"
  | "We will Active Voice"
  | "Graph";

export type IShortcutType = "insert" | "replace" | "refine";
