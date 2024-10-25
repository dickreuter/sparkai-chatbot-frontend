import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";
import {
  EditorState,
  convertFromRaw,
  convertToRaw,
  ContentState
} from "draft-js";
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
  documents: Document[];
  currentDocumentIndex: number;
}

export interface BidContextType {
  sharedState: SharedState;
  setSharedState: React.Dispatch<React.SetStateAction<SharedState>>;
  saveProposal: () => void;
  getBackgroundInfo: () => string;
  addDocument: () => void;
  removeDocument: (index: number) => void;
  selectDocument: (index: number) => void;
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
    documents: [
      {
        name: "Q&A Sheet",
        editorState: EditorState.createEmpty(),
        type: "qa sheet"
      }
    ],
    currentDocumentIndex: 0
  },
  setSharedState: () => {},
  saveProposal: () => {},
  getBackgroundInfo: () => "",
  addDocument: () => {},
  removeDocument: (index: number) => {},
  selectDocument: (index: number) => {}
};

export const BidContext = createContext<BidContextType>(defaultState);

const BidManagement: React.FC = () => {
  const [sharedState, setSharedState] = useState<SharedState>(() => {
    const savedState = localStorage.getItem("bidState");
    //console.log('Saved state from localStorage:', savedState); // Debug log
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      //console.log('Parsed state:', parsedState); // Debug log
      return {
        ...parsedState,
        documents: parsedState.documents.map((doc) => {
          //console.log('Processing document:', doc); // Debug log
          return {
            ...doc,
            editorState: doc.editorState
              ? EditorState.createWithContent(
                  convertFromRaw(JSON.parse(doc.editorState))
                )
              : EditorState.createEmpty(),
            type: doc.type || "qa sheet"
          };
        }),
        contributors: parsedState.contributors || {},
        original_creator: parsedState.original_creator || "",
        isSaved: false,
        isLoading: false,
        saveSuccess: null,
        object_id: parsedState.object_id || null,
        currentDocumentIndex: parsedState.currentDocumentIndex || 0
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

  const addDocument = async (
    name: string,
    type: "qa sheet" | "execSummary" | "coverLetter"
  ) => {
    setSharedState((prevState) => ({
      ...prevState,
      isLoading: true
    }));

    try {
      const editorState = await getInitialEditorState(type);
      setSharedState((prevState) => {
        const newDocument = {
          name: name || `Document ${prevState.documents.length + 1}`,
          editorState,
          type
        };
        //console.log('Adding new document:', newDocument);
        return {
          ...prevState,
          documents: [...prevState.documents, newDocument],
          currentDocumentIndex: prevState.documents.length,
          isLoading: false
        };
      });
    } catch (error) {
      //console.error("Error adding document:", error);
      setSharedState((prevState) => ({
        ...prevState,
        isLoading: false
      }));
      displayAlert("Failed to add document. Please try again.", "error");
    }
  };

  const getInitialEditorState = async (
    type: "qa sheet" | "execSummary" | "coverLetter"
  ) => {
    let template = "";
    console.log("get initial editor state");
    const makeApiCall = async (endpoint: string) => {
      if (!sharedState.object_id) {
        throw new Error("No bid ID available. Please save the bid first.");
      }

      const formData = new FormData();
      formData.append("bid_id", sharedState.object_id);

      try {
        const result = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/${endpoint}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );
        console.log(`API response for ${endpoint}:`, result.data);
        return result.data;
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          throw new Error(
            "No documents found in the tender library. Please upload documents before generating content."
          );
        }
        throw error;
      }
    };
    try {
      switch (type) {
        case "execSummary":
          const execSummaryData = await makeApiCall("generate_exec_summary");
          template = execSummaryData.exec_summary;
          break;
        case "coverLetter":
          const coverLetterData = await makeApiCall("generate_cover_letter");
          template = coverLetterData.cover_letter;
          break;
        case "qa sheet":
        default:
          template = `Question 1: [Copy the exact question from the tender document]
  
  Answer: [Provide a clear, concise, and specific answer. Use bullet points or numbered lists where appropriate. Include relevant examples or case studies if possible.]
  
  Question 2: [Next question from the tender document]
  
  Answer: [Answer to question 2. Remember to:
  - Address all parts of the question
  - Highlight your strengths and unique selling points
  - Provide evidence to support your claims
  - Use industry-specific terminology appropriately]
  
  [Continue with additional Question/Answer pairs as needed]`;
      }
    } catch (error) {
      const errorMessage = `Error generating ${type}. Please try again.`;
      displayAlert(
        `Failed to generate ${type}. Using default template.`,
        "warning"
      );
      template = errorMessage;
    }

    return EditorState.createWithContent(ContentState.createFromText(template));
  };

  const removeDocument = (index) => {
    setSharedState((prevState) => {
      const updatedDocuments = prevState.documents.filter(
        (_, docIndex) => docIndex !== index
      );
      const newIndex = Math.min(
        prevState.currentDocumentIndex,
        updatedDocuments.length - 1
      );
      return {
        ...prevState,
        documents: updatedDocuments,
        currentDocumentIndex: newIndex
      };
    });
  };

  const selectDocument = (index) => {
    setSharedState((prevState) => ({
      ...prevState,
      currentDocumentIndex: index
    }));
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
      documents,
      bid_qualification_result,
      client_name,
      opportunity_owner,
      submission_deadline,
      bid_manager,
      contributors,
      questions,
      object_id,
      original_creator
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
    appendFormData("text", "Sample text");
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

    const documentsFormatted = documents.map((doc) => {
      return {
        name: doc.name,
        text: doc.editorState.getCurrentContent().getPlainText(),
        type: doc.type
      };
    });
    //console.log('Formatted documents:', documentsFormatted); // Debug log
    formData.append("documents", JSON.stringify(documentsFormatted));

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
      ...sharedState,
      documents: sharedState.documents.map((doc) => {
        //console.log('Preparing document for localStorage:', doc); // Debug log
        return {
          ...doc,
          editorState: JSON.stringify(
            convertToRaw(doc.editorState.getCurrentContent())
          ),
          type: doc.type
        };
      })
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
    sharedState.documents,
    sharedState.original_creator,
    canUserSave // Add canUserSave to the dependency array
  ]);

  return (
    <BidContext.Provider
      value={{
        sharedState,
        setSharedState,
        saveProposal,
        getBackgroundInfo,
        addDocument,
        removeDocument,
        selectDocument,
        canUserSave
      }}
    >
      <Outlet />
    </BidContext.Provider>
  );
};

export default BidManagement;
