import React, { createContext, useState, useEffect, useRef } from 'react';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import { useAuthUser } from 'react-auth-kit';
import { displayAlert } from '../helper/Alert';

export interface Document {
  name: string;
  editorState: EditorState;
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
  contributors: string;
  isSaved: boolean;
  isLoading: boolean;
  saveSuccess: boolean | null;
  object_id: string | null;
  documents: Document[]; // Add documents array
  currentDocumentIndex: number; // Track the current document being edited
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
    bidInfo: '',
    opportunity_information: '',
    compliance_requirements: '',
    questions: '',
    client_name: '',
    bid_qualification_result: '',
    opportunity_owner: '',
    submission_deadline: '',
    bid_manager: '',
    contributors: '',
    isSaved: false,
    isLoading: false,
    saveSuccess: null,
    object_id: null,
    documents: [{ name: 'Document 1', editorState: EditorState.createEmpty() }],
    currentDocumentIndex: 0,
  },
  setSharedState: () => {},
  saveProposal: () => {},
  getBackgroundInfo: () => '',
  addDocument: () => {},
  removeDocument: (index: number) => {},
  selectDocument: (index: number) => {},
};

export const BidContext = createContext<BidContextType>(defaultState);

const BidManagement: React.FC = () => {
  const [sharedState, setSharedState] = useState<SharedState>(() => {
    const savedState = localStorage.getItem('bidState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        ...parsedState,
        documents: parsedState.documents.map(doc => ({
          ...doc,
          editorState: doc.editorState
            ? EditorState.createWithContent(convertFromRaw(JSON.parse(doc.editorState)))
            : EditorState.createEmpty(),
        })),
        isSaved: false,
        isLoading: false,
        saveSuccess: null,
        object_id: parsedState.object_id || null,
        currentDocumentIndex: parsedState.currentDocumentIndex || 0,
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

  const addDocument = (name) => {
    setSharedState((prevState) => {
      const newDocument = {
        name: name || `Document ${prevState.documents.length + 1}`,
        editorState: EditorState.createEmpty()
      };
      return {
        ...prevState,
        documents: [...prevState.documents, newDocument],
        currentDocumentIndex: prevState.documents.length
      };
    });
  };
  
  const removeDocument = (index) => {
    setSharedState((prevState) => {
      const updatedDocuments = prevState.documents.filter((_, docIndex) => docIndex !== index);
      const newIndex = Math.min(prevState.currentDocumentIndex, updatedDocuments.length - 1);
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
  

  const saveProposal = async () => {
    const {
        bidInfo, compliance_requirements, opportunity_information, documents, 
        bid_qualification_result, client_name, opportunity_owner, submission_deadline, 
        bid_manager, contributors, questions, object_id
    } = sharedState;

    if (!bidInfo || bidInfo.trim() === '') {
        displayAlert('Please type in a bid name...', 'warning');
        return;
    }

    setSharedState(prevState => ({ ...prevState, isLoading: true, saveSuccess: null }));

    const backgroundInfo = getBackgroundInfo();

    const formData = new FormData();
    const appendFormData = (key, value) => {
        formData.append(key, value && value.trim() !== '' ? value : ' ');
    };

    appendFormData('bid_title', bidInfo);
    appendFormData('text', 'Sample text'); // Assuming this is a required field
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

    // Prepare documents field
    const documentsFormatted = documents.map(doc => ({
        name: doc.name,
        text: doc.editorState.getCurrentContent().getPlainText()
    }));
    formData.append('documents', JSON.stringify(documentsFormatted));

    if (object_id) {
        appendFormData('object_id', object_id);
    }

    console.log(formData);

    try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Adding a delay before starting the save
        const response = await axios.post(
            `http${HTTP_PREFIX}://${API_URL}/upload_bids`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${tokenRef.current}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        const { bid_id } = response.data;

        setSharedState(prevState => ({
            ...prevState,
            isSaved: true,
            isLoading: false,
            saveSuccess: true,
            object_id: bid_id, // Update the object_id in the shared state
        }));
        setTimeout(() => setSharedState(prevState => ({ ...prevState, isSaved: false })), 3000); // Reset after 3 seconds
    } catch (error) {
        console.error("Error saving proposal:", error);
        setSharedState(prevState => ({ ...prevState, isLoading: false, saveSuccess: false }));
    }
};



  useEffect(() => {
    const stateToSave = {
      ...sharedState,
      documents: sharedState.documents.map(doc => ({
        ...doc,
        editorState: JSON.stringify(convertToRaw(doc.editorState.getCurrentContent()))
      }))
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
    sharedState.client_name,
    sharedState.bid_qualification_result,
    sharedState.opportunity_owner,
    sharedState.submission_deadline,
    sharedState.bid_manager,
    sharedState.contributors,
    sharedState.documents
  ]);

  return (
    <BidContext.Provider value={{ sharedState, setSharedState, saveProposal, getBackgroundInfo, addDocument, removeDocument, selectDocument }}>
      <Outlet />
    </BidContext.Provider>
  );
};

export default BidManagement;
