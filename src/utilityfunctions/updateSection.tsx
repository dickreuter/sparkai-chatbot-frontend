import axios from "axios";
import { MutableRefObject, useRef } from "react";
import { useAuthUser } from "react-auth-kit";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { Section } from "../views/BidWritingStateManagerView";

export const updateSection = (
  section: Section,
  sectionIndex: number,
  setSharedState: React.Dispatch<React.SetStateAction<any>>
) => {
  setSharedState((prevState) => ({
    ...prevState,
    outline: prevState.outline.map((s: Section, index: number) =>
      index === sectionIndex ? { ...s, ...section } : s
    )
  }));
};

export const fetchOutline = async (
  bid_id: string,
  tokenRef: MutableRefObject<string>,
  setSharedState: React.Dispatch<React.SetStateAction<any>>
): Promise<void> => {
  if (!bid_id) return;
  const formData = new FormData();
  formData.append("bid_id", bid_id);
  try {
    const response = await axios.post(
      `http${HTTP_PREFIX}://${API_URL}/get_bid_outline`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          "Content-Type": "multipart/form-data"
        }
      }
    );

    const outlineWithStatus = response.data.map((section: any) => ({
      ...section,
      status:
        section.status ||
        (section.completed
          ? "Completed"
          : section.in_progress
            ? "In Progress"
            : "Not Started")
    }));

    setSharedState((prevState) => ({
      ...prevState,
      outline: outlineWithStatus
    }));
  } catch (err) {
    console.error("Error fetching outline:", err);
  }
};
