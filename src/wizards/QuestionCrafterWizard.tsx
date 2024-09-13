import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";
import CustomWizard from './CustomWizard';

const QuestionCrafterWizard = () => {
  console.log('QuestionCrafterWizard component rendering');

  const [isShow, setIsShow] = useState(false);
  console.log('Initial isShow state:', isShow);

  const steps = [
    {
      elementId: 'question-section',
      title: 'Question Section',
      description: 'Where the magic happens🪄 Enter your question here pick and folder from your content library to narrow down the search.',
    },
    {
      elementId: 'answer-section',
      title: 'Answer Section',
      description:'Your answer will appear here. Need to tweak it? No problem! You can edit and perfect the response to fit your needs.'
    },
    {
      elementId: 'bid-pilot-section',
      title: 'Bid Pilot',
      description: "Meet Bid Pilot, your AI sidekick! 🤖 Need help refining answers or tackling tricky questions? Highlight some text in the answer to use prompts. ",
    },
    {
      elementId: 'bid-pilot-options',
      title: 'Bid Pilot Options',
      description: 'Choose between Internet Search and Library Chat for different types of assistance.',
    },
    {
      elementId: 'qa-sheet-selector',
      title: 'Q/A Sheet',
      description: 'Finished with the question? Select a Q/A sheet to add the question and answer to your bid compiler.',
      position: 'down'
    },
  ];

  useEffect(() => {
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('questionCrafterTourCompleted');
    console.log('tourCompleted value from localStorage:', tourCompleted);

    if (tourCompleted === 'false') {
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
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default QuestionCrafterWizard;