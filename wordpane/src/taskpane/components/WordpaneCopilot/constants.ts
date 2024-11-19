import { IPromptType } from "../../../types";

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
];

export const BID_PILOT_CHOICE = "2";
export const BID_PILOT_BROADNESS = "4";
