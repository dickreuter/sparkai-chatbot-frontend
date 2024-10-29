export interface IPilotOption {
  type: "text" | "image";
  value: string;
}

export type IPromptType =
  | "Summarise"
  | "Diagram"
  | "Expand"
  | "Rephrase"
  | "Inject Company Voice"
  | "Inject Tender Context"
  | "Improve Grammar"
  | "Add Statistics"
  | "For Example"
  | "Translate to English"
  | "We will Active Voice";
