import React, { createContext, useState, useEffect, useRef } from 'react';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import { useAuthUser } from 'react-auth-kit';
import { displayAlert } from '../helper/Alert';

interface SharedState {
  bidInfo: string;
  opportunity_information: string;
  compliance_requirements: string;
  questions: string;
  editorState: EditorState;
  client_name: string;
  bid_qualification_result: string;
  opportunity_owner: string;
  submission_deadline: string;
  bid_manager: string;
  contributors: string;
  isSaved: boolean;
  isLoading: boolean;
  saveSuccess: boolean | null; // null: no attempt, true: success, false: failure
}

interface BidContextType {
  sharedState: SharedState;
  setSharedState: React.Dispatch<React.SetStateAction<SharedState>>;
  saveProposal: () => void;
  getBackgroundInfo: () => string;
}

const defaultState: BidContextType = {
  sharedState: {
    bidInfo: '',
    opportunity_information: '',
    compliance_requirements: '',
    questions: '',
    editorState: EditorState.createEmpty(),
    client_name: '',
    bid_qualification_result: '',
    opportunity_owner: '',
    submission_deadline: '',
    bid_manager: '',
    contributors: '',
    isSaved: false,
    isLoading: false,
    saveSuccess: null,
  },
  setSharedState: () => {},
  saveProposal: () => {},
  getBackgroundInfo: () => '',
};

export const BidContext = createContext<BidContextType>(defaultState);

const BidManagement: React.FC = () => {
  const [sharedState, setSharedState] = useState<SharedState>(() => {
    const savedState = localStorage.getItem('bidState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        ...parsedState,
        editorState: parsedState.editorState
          ? EditorState.createWithContent(convertFromRaw(JSON.parse(parsedState.editorState)))
          : EditorState.createEmpty(),
        isSaved: false,
        isLoading: false,
        saveSuccess: null,
      };
    }
    return defaultState.sharedState;
  });

  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const getBackgroundInfo = () => {
    return `${sharedState.opportunity_information}\n${sharedState.compliance_requirements}`;
  };

  const saveProposal = async () => {
    const { bidInfo, compliance_requirements, opportunity_information, editorState, bid_qualification_result, client_name, opportunity_owner, submission_deadline, bid_manager, contributors, questions } = sharedState;

    if (!bidInfo || bidInfo.trim() === '') {
      displayAlert('Please type in a bid name...', 'warning');
      return;
    }

    console.log("saving")
    
    setSharedState(prevState => ({ ...prevState, isLoading: true, saveSuccess: null }));

    const editorContentState = editorState.getCurrentContent();
    const editorText = editorContentState.getPlainText('\n');
    const backgroundInfo = getBackgroundInfo();

    const formData = new FormData();
    const appendFormData = (key, value) => {
      formData.append(key, value && value.trim() !== '' ? value : ' ');
    };

    appendFormData('bid_title', bidInfo);
    appendFormData('text', editorText);
    appendFormData('status', 'ongoing');
    appendFormData('contract_information', backgroundInfo);
    appendFormData('compliance_requirements', compliance_requirements);
    appendFormData('opportunity_information', opportunity_information);
    appendFormData('client_name', client_name);
    appendFormData('bid_qualification_result', bid_qualification_result);
    appendFormData('opportunity_owner', opportunity_owner);
    appendFormData('bid_manager', bid_manager);
    appendFormData('contributors', contributors);
    appendFormData('submission_deadline', submission_deadline);
    appendFormData('questions', questions);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Adding a delay before starting the save
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/upload_bids`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSharedState(prevState => ({ ...prevState, isSaved: true, isLoading: false, saveSuccess: true }));
      setTimeout(() => setSharedState(prevState => ({ ...prevState, isSaved: false })), 3000); // Reset after 3 seconds
    } catch (error) {
      console.error("Error saving proposal:", error);
      setSharedState(prevState => ({ ...prevState, isLoading: false, saveSuccess: false }));
    }
  };

  useEffect(() => {
    const stateToSave = {
      ...sharedState,
      editorState: sharedState.editorState
        ? JSON.stringify(convertToRaw(sharedState.editorState.getCurrentContent()))
        : ''
    };
    localStorage.setItem('bidState', JSON.stringify(stateToSave));

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTypingTimeout(setTimeout(() => {
      saveProposal();
    }, 2000));
  }, [
    sharedState.bidInfo,
    sharedState.opportunity_information,
    sharedState.compliance_requirements,
    sharedState.questions,
    sharedState.editorState,
    sharedState.client_name,
    sharedState.bid_qualification_result,
    sharedState.opportunity_owner,
    sharedState.submission_deadline,
    sharedState.bid_manager,
    sharedState.contributors
  ]);

  return (
    <BidContext.Provider value={{ sharedState, setSharedState, saveProposal, getBackgroundInfo }}>
      <Outlet />
    </BidContext.Provider>
  );
};

export default BidManagement;
