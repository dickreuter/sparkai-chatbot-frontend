import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const QuestionCrafterWizard = () => {
  console.log('QuestionCrafterWizard component rendering');

  const [isShow, setIsShow] = useState(false);
  console.log('Initial isShow state:', isShow);

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
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('questionCrafterTourCompleted');
    console.log('tourCompleted value from localStorage:', tourCompleted);

    if (tourCompleted === null) {
      console.log('Tour not completed, setting isShow to true');
      setIsShow(true);
    } else {
      console.log('Tour already completed, isShow remains false');
    }
  }, []);

  const handleClose = () => {
    console.log('handleClose called');
    setIsShow(false);
    localStorage.setItem('questionCrafterTourCompleted', 'true');
    console.log('questionCrafterTourCompleted set to true in localStorage');
  };

  console.log('Rendering Wizard with isShow:', isShow);

  return (
    <>
      {isShow && (
        <Wizard
          rule={rule}
          isShow={isShow}
          closeButtonTitle="End Tour"
          closeButtonElement={<button onClick={handleClose}>End Tour</button>}
          isScrollToElement={false}
        />
      )}
      {!isShow && <div style={{ display: 'none' }}>Wizard is not shown</div>}
    </>
  );
};

export default QuestionCrafterWizard;