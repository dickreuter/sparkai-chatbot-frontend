import axios from "axios";
import { MutableRefObject, useRef } from "react";
import { useAuthUser } from "react-auth-kit";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { Section } from "../components/StatusMenu";

export const updateSection = async (
  section: Section,
  sectionIndex: number,
  bid_id: string,
  tokenRef: MutableRefObject<any>
) => {
  try {
    await axios.post(
      `http${HTTP_PREFIX}://${API_URL}/update_section`,
      {
        bid_id: bid_id,
        section: section,
        section_index: sectionIndex
      },
      {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Error updating section:", err);
  }
};
