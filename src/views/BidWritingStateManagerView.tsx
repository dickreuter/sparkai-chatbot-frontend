import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import BidExtractor from './BidExtractor';
import QuestionCrafter from './QuestionCrafter';
import Proposal from './Proposal';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';

interface SharedState {
  bidInfo: string;
  backgroundInfo: string;
  questions: string[];
  editorState: EditorState;
}

interface BidContextType {
  sharedState: SharedState;
  setSharedState: React.Dispatch<React.SetStateAction<SharedState>>;
}

const defaultState: BidContextType = {
  sharedState: {
    bidInfo: '',
    backgroundInfo: '',
    questions: [],
    editorState: EditorState.createEmpty(),
  },
  setSharedState: () => {},
};

// Create a context for the shared state
export const BidContext = createContext<BidContextType>(defaultState);

const BidManagement: React.FC = () => {
  const [sharedState, setSharedState] = useState<SharedState>(() => {
    // Retrieve the initial state from localStorage
    const savedState = localStorage.getItem('bidState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        ...parsedState,
        editorState: parsedState.editorState ? 
                     EditorState.createWithContent(convertFromRaw(JSON.parse(parsedState.editorState))) :
                     EditorState.createEmpty(),
      };
    }
    return {
      bidInfo: '',
      backgroundInfo: '',
      questions: [],
      editorState: EditorState.createEmpty(),
    };
  });

  useEffect(() => {
    // Persist the state to localStorage whenever it changes
    const stateToSave = {
      ...sharedState,
      editorState: sharedState.editorState ? 
                   JSON.stringify(convertToRaw(sharedState.editorState.getCurrentContent())) : 
                   ''
    };
    localStorage.setItem('bidState', JSON.stringify(stateToSave));
  }, [sharedState]);

  return (
    <BidContext.Provider value={{ sharedState, setSharedState }}>
      <Outlet />
    </BidContext.Provider>
  );
};

export default BidManagement;
