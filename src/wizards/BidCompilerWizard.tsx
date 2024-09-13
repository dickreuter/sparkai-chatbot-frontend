import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";
import CustomWizard from './CustomWizard';

const BidCompilerWizard = () => {
  console.log('BidCompilerWizard component rendering');

  const [isShow, setIsShow] = useState(false);
  console.log('Initial isShow state:', isShow);

  const steps = [
    {
      elementId: 'proposal-editor',
      title: 'Proposal Editor',
      description: 'This is the main editor where you can write and edit your proposal Use the toolbar for formatting options ✍️ ',
    },
    {
      elementId: 'tab-container',
      title: 'Document Tabs',
      description: 'Switch between different sections or documents of your proposal using these tabs. 📚',
    },
    {
      elementId: 'add-section-button',
      title: 'Add New Section',
      description: 'Click the plus button here to add a new document to your proposal. Here you can add an Executive Summary or Cover Letter. ',
      position: 'down'
    },
  ];

  useEffect(() => {
    const checkTourStatus = () => {
      const tourCompleted = localStorage.getItem('bidCompilerTourCompleted');
      setIsShow(tourCompleted === 'false');
    };

    // Check initial status
    checkTourStatus();

    // Listen for the custom event
    const handleShowTips = () => {
      checkTourStatus();
    };

    window.addEventListener('showTips', handleShowTips);

    // Cleanup
    return () => {
      window.removeEventListener('showTips', handleShowTips);
    };
  }, []);


  const handleClose = () => {
    console.log('handleClose called, setting isShow to false');
    setIsShow(false);
    localStorage.setItem('bidCompilerTourCompleted', 'true');
    console.log('bidCompilerTourCompleted set to true in localStorage');
  };

  console.log('Rendering Wizard with isShow:', isShow);

  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default BidCompilerWizard;