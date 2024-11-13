export interface IMessage {
  type: "text" | "image" | "loading";
  value: string;
  createdBy: "user" | "bot";
  action: "default" | IPromptType;
  isRefine: boolean;
  id: string;
}

export type IPromptType =
  | "Summarise"
  | "Expand"
  | "Inject Tender Context"
  | "Inject Company Voice"
  | "We will Active Voice"
  | "Graph";

export type IShortcutType = "insert" | "replace" | "refine";

export interface IPromptOption {
  isRefine: boolean;
}

export type IButtonStatus = "hidden" | "disabled" | "enabled";

export type IChatTypes = "library-chat" | "internet-search";
