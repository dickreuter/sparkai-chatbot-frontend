import { IPromptType } from "../../../types";

export const LOCAL_STORAGE_CACHE_VERSION = "0.0.1";

export const customPrompts: { id: IPromptType; title: string }[] = [
  {
    id: "Summarise",
    title: "Summarise",
  },
  {
    id: "Expand",
    title: "Expand",
  },
  {
    id: "Inject Tender Context",
    title: "Inject Tender Context",
  },
  {
    id: "Inject Company Voice",
    title: "Inject Tone-of-Voice",
  },
  {
    id: "We will Active Voice",
    title: "Active Voice",
  },
  {
    id: "Custom Prompt",
    title: "Custom Prompt",
  },
];

export const BID_PILOT_CHOICE = "2";
export const BID_PILOT_BROADNESS = "4";

export const ALLOWED_TAGS = [
  "div",
  "p",
  "ol",
  "li",
  "strong",
  "ul",
  "pre",
  "code",
  "span",
  "svg",
  "path",
  "br",
  "em",
  "h1",
];
export const ALLOWED_ATTRIBUTES = {
  span: ["style"],
  font: ["color", "weight", "style"],
  li: [],
  ul: [],
  ol: [],
  code: ["style"],
  strong: [],
};
