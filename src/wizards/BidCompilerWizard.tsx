import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const BidCompilerWizard = () => {
  const [isShow, setIsShow] = useState(true);

  const rule = [
    {
      elementId: 'proposal-editor',
      title: 'Proposal Editor',
      description: 'This is the main editor where you can write and edit your proposal. It includes various formatting options.',
    },
    {
      elementId: 'tab-container',
      title: 'Document Tabs',
      description: 'Switch between different sections or documents of your proposal using these tabs.',
    },
    
      {
        elementId: 'add-section-button',
        title: 'Add New Section',
        description: 'Click here to add a new document to your proposal.',
      },
  
    
  ];

  useEffect(() => {
    const isFirstVisit = localStorage.getItem('bidCompilerTourCompleted') !== 'true';
    setIsShow(isFirstVisit);
  }, []);

  const handleClose = () => {
    setIsShow(false);
    localStorage.setItem('bidCompilerTourCompleted', 'true');
  };

  return (
    <Wizard 
      rule={rule}
      isShow={isShow}
      closeButtonTitle="End Tour"
      closeButtonElement={<button onClick={handleClose}>End Tour</button>}
      isScrollToElement={true}
    />
  );
};

export default BidCompilerWizard;