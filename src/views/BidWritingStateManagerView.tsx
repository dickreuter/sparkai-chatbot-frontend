import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";
import { EditorState } from "draft-js";
import { Outlet } from "react-router-dom";
import axios from "axios";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { useAuthUser } from "react-auth-kit";
import { displayAlert } from "../helper/Alert";

export interface Document {
  name: string;
  editorState: EditorState;
  type: "qa sheet" | "execSummary" | "coverLetter";
}

export interface Subheading {
  subheading_id: string;
  title: string;
  extra_instructions: string;
  word_count: number;
}

export interface Section {
  section_id: string;
  heading: string;
  question: string;
  word_count: number;
  answer: string;
  reviewer: string;
  status: "Not Started" | "In Progress" | "Completed";
  weighting?: string;
  page_limit?: string;
  subsections: number;
  subheadings: Subheading[];
  choice: string;
}

export interface Contributor {
  [login: string]: string; // login: permission
}

export interface SharedState {
  bidInfo: string;
  opportunity_information: string;
  compliance_requirements: string;
  questions: string;
  client_name: string;
  bid_qualification_result: string;
  opportunity_owner: string;
  submission_deadline: string;
  bid_manager: string;
  contributors: Contributor;
  original_creator: string;
  isSaved: boolean;
  isLoading: boolean;
  saveSuccess: boolean | null;
  object_id: string | null;
  selectedFolders: string[];
  outline: Section[];
}

export interface BidContextType {
  sharedState: SharedState;
  setSharedState: React.Dispatch<React.SetStateAction<SharedState>>;
  saveProposal: () => void;
  getBackgroundInfo: () => string;
}

const defaultState: BidContextType = {
  sharedState: {
    bidInfo: "",
    opportunity_information: "",
    compliance_requirements: "",
    questions: "",
    client_name: "",
    bid_qualification_result: "",
    opportunity_owner: "",
    submission_deadline: "",
    bid_manager: "",
    contributors: {},
    original_creator: "",
    isSaved: false,
    isLoading: false,
    saveSuccess: null,
    object_id: null,
    selectedFolders: ["default"],
    outline: []
  },
  setSharedState: () => {},
  saveProposal: () => {},
  getBackgroundInfo: () => ""
};

export const BidContext = createContext<BidContextType>(defaultState);

const BidManagement: React.FC = () => {
  // In BidManagement.tsx, modify the state initialization:
  const [sharedState, setSharedState] = useState<SharedState>(() => {
    const savedState = localStorage.getItem("bidState");
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        ...parsedState,
        contributors: parsedState.contributors || {},
        original_creator: parsedState.original_creator || "",
        isSaved: false,
        isLoading: false,
        saveSuccess: null,
        object_id: parsedState.object_id || null,
        currentDocumentIndex: parsedState.currentDocumentIndex || 0,
        selectedFolders: parsedState.selectedFolders || ["default"], // Add this line
        outline: parsedState.outline || []
      };
    }
    return defaultState.sharedState;
  });

  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const getBackgroundInfo = () => {
    return `${sharedState.opportunity_information}\n${sharedState.compliance_requirements}`;
  };

  const canUserSave = useCallback((): boolean => {
    console.log(currentUserEmail);
    //login
    const userPermission = sharedState.contributors[auth.email];
    return userPermission === "admin" || userPermission === "editor";
  }, [sharedState.contributors, currentUserEmail]);

  const saveProposal = async () => {
    if (!canUserSave()) {
      console.log(
        "User does not have permission to save. Skipping save operation."
      );
      return;
    }

    const {
      bidInfo,
      compliance_requirements,
      opportunity_information,
      bid_qualification_result,
      client_name,
      opportunity_owner,
      submission_deadline,
      bid_manager,
      contributors,
      questions,
      object_id,
      original_creator,
      outline
    } = sharedState;

    if (!bidInfo || bidInfo.trim() === "") {
      displayAlert("Please type in a bid name...", "warning");
      return;
    }

    setSharedState((prevState) => ({
      ...prevState,
      isLoading: true,
      saveSuccess: null
    }));

    const backgroundInfo = getBackgroundInfo();

    const formData = new FormData();
    const appendFormData = (key, value) => {
      formData.append(key, value && value.trim() !== "" ? value : " ");
    };

    appendFormData("bid_title", bidInfo);
    appendFormData("status", "ongoing");
    appendFormData("contract_information", backgroundInfo);
    appendFormData("compliance_requirements", compliance_requirements);
    appendFormData("opportunity_information", opportunity_information);
    appendFormData("client_name", client_name);
    appendFormData("bid_qualification_result", bid_qualification_result);
    appendFormData("opportunity_owner", opportunity_owner);
    appendFormData("bid_manager", bid_manager);
    formData.append("contributors", JSON.stringify(contributors));
    appendFormData("submission_deadline", submission_deadline);
    appendFormData("questions", questions);
    appendFormData("original_creator", original_creator);
    formData.append("outline", JSON.stringify(outline));

    if (object_id) {
      appendFormData("object_id", object_id);
    }

    // console.log(formData);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/upload_bids`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const { bid_id } = response.data;

      setSharedState((prevState) => ({
        ...prevState,
        isSaved: true,
        isLoading: false,
        saveSuccess: true,
        object_id: bid_id
      }));
      setTimeout(
        () => setSharedState((prevState) => ({ ...prevState, isSaved: false })),
        3000
      );
    } catch (error) {
      console.error("Error saving proposal:", error);
      setSharedState((prevState) => ({
        ...prevState,
        isLoading: false,
        saveSuccess: false
      }));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http${HTTP_PREFIX}://${API_URL}/profile`,
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`
            }
          }
        );
        setCurrentUserEmail(response.data.email);
      } catch (err) {
        console.log("Failed to load profile data");
      }
    };

    fetchUserData();
  }, [tokenRef]);

  useEffect(() => {
    const stateToSave = {
      ...sharedState
    };
    //console.log('State being saved to localStorage:', stateToSave); // Debug log
    localStorage.setItem("bidState", JSON.stringify(stateToSave));

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Start the timer for all users
    setTypingTimeout(
      setTimeout(() => {
        // Only perform the save operation if the user has permission
        if (canUserSave()) {
          saveProposal();
        } else {
          console.log(
            "Auto-save skipped: User does not have permission to save."
          );
        }
      }, 2000)
    );
  }, [
    sharedState.bidInfo,
    sharedState.opportunity_information,
    sharedState.compliance_requirements,
    sharedState.questions,
    sharedState.client_name,
    sharedState.bid_qualification_result,
    sharedState.opportunity_owner,
    sharedState.submission_deadline,
    sharedState.bid_manager,
    sharedState.contributors,
    sharedState.original_creator,
    sharedState.selectedFolders,
    sharedState.outline,
    canUserSave
  ]);

  return (
    <BidContext.Provider
      value={{
        sharedState,
        setSharedState,
        saveProposal,
        getBackgroundInfo
      }}
    >
      <Outlet />
    </BidContext.Provider>
  );
};

export default BidManagement;
