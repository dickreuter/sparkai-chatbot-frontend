import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const QuestionCrafterWizard = () => {
  const [isShow, setIsShow] = useState(true);

  const rule = [
    {
      elementId: 'question-section',
      title: 'Question Section',
      description: 'Enter your question here. Select a folder in the content library to search from.',
    },
    {
      elementId: 'answer-section',
      title: 'Answer Section',
      description: 'The generated answer will appear here. You can edit the response if needed.',
    },
    {
      elementId: 'bid-pilot-section',
      title: 'Bid Pilot',
      description: 'Use Bid Pilot for additional assistance and to refine your answers.',
    },
    {
      elementId: 'bid-pilot-options',
      title: 'Bid Pilot Options',
      description: 'Choose between Internet Search and Library Chat for different types of assistance.',
    },
    {
      elementId: 'qa-sheet-selector',
      title: 'Q/A Sheet Selector',
      description: 'Select a Q/A sheet to add the question and answer to your bid compiler.',
    },
  
   
  ];

  useEffect(() => {
    const isFirstVisit = localStorage.getItem('questionCrafterTourCompleted') !== 'true';
    setIsShow(isFirstVisit);
  }, []);

  const handleClose = () => {
    setIsShow(false);
    localStorage.setItem('questionCrafterTourCompleted', 'true');
  };

  return (
    <Wizard 
      rule={rule}
      isShow={isShow}
      closeButtonTitle="End Tour"
      closeButtonElement={<button onClick={handleClose}>End Tour</button>}
      isScrollToElement={false}
    />
  );
};

export default QuestionCrafterWizard;