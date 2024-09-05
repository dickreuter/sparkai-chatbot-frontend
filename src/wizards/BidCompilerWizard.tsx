import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const BidCompilerWizard = () => {
  console.log('BidCompilerWizard component rendering');

  const [isShow, setIsShow] = useState(false);
  console.log('Initial isShow state:', isShow);

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
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('bidCompilerTourCompleted');
    console.log('tourCompleted value from localStorage:', tourCompleted);
    if (tourCompleted === null) {
      console.log('Tour not completed, setting isShow to true');
      setIsShow(true);
    } else {
      console.log('Tour already completed, isShow remains false');
    }
  }, []);

  const handleClose = () => {
    console.log('handleClose called, setting isShow to false');
    setIsShow(false);
    localStorage.setItem('bidCompilerTourCompleted', 'true');
    console.log('bidCompilerTourCompleted set to true in localStorage');
  };

  console.log('Rendering Wizard with isShow:', isShow);

  return (
    <>
      {isShow && (
        <Wizard
          rule={rule}
          isShow={false}
          closeButtonTitle="End Tour"
          closeButtonElement={<button onClick={handleClose}>End Tour</button>}
          isScrollToElement={true}
        />
      )}
      {!isShow && <div style={{ display: 'none' }}>Wizard is not shown</div>}
    </>
  );
};

export default BidCompilerWizard;