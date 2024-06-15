import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import BidExtractor from './BidExtractor';
import QuestionCrafter from './QuestionCrafter';
import Proposal from './Proposal';

interface SharedState {
  bidInfo: string;
  backgroundInfo: string;
  questions: string[];
  editorState: string;
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
    editorState: '',
  },
  setSharedState: () => {},
};

// Create a context for the shared state
export const BidContext = createContext<BidContextType>(defaultState);

const BidManagement: React.FC = () => {
  const [sharedState, setSharedState] = useState<SharedState>(() => {
    // Retrieve the initial state from localStorage
    const savedState = localStorage.getItem('bidState');
    return savedState ? JSON.parse(savedState) : {
      bidInfo: '',
      backgroundInfo: '',
      questions: [],
      editorState: '',
    };
  });

  useEffect(() => {
    // Persist the state to localStorage whenever it changes
    localStorage.setItem('bidState', JSON.stringify(sharedState));
  }, [sharedState]);

  return (
    <BidContext.Provider value={{ sharedState, setSharedState }}>
      <Outlet />
    </BidContext.Provider>
  );
};

export default BidManagement;
