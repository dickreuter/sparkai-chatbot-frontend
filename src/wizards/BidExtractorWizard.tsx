import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";
import CustomWizard from './CustomWizard';

const BidExtractorWizard = () => {
  console.log('BidExtractorWizard component rendering');

  const [isShow, setIsShow] = useState(false);
  console.log('Initial isShow state:', isShow);

  const steps = [
    {
      elementId: 'proposal-header',
      title: 'Bid Title',
      description: 'This is the title of your bid. You can edit it by clicking the "edit" button.',
      position: 'down'
    },
    {
      elementId: 'contributors-card',
      title: 'Contributors',
      description: 'Teamwork makes the dream work! 🚀 View and manage the contributors to this bid. Add users from your organisation to work on this bid.',
    position: 'left'
    },
    {
      elementId: 'opportunity-information-card',
      title: 'Auto Extraction',
      description: 'Extract the Opportunity Information and Compliance Requirements for your bid automatically using the tool icon. Our AI will use documents in your Tender Library as context.',
       position: 'farleft'
    },
    {
      elementId: 'tender-library',
      title: 'Tender Library',
      description: 'Manage and view documents related to this bid in the Tender Library.',
      position: 'down'
    }
  ];

  useEffect(() => {
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('bidExtractorTourCompleted');
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
    localStorage.setItem('bidExtractorTourCompleted', 'true');
    console.log('bidExtractorTourCompleted set to true in localStorage');
  };

  console.log('Rendering Wizard with isShow:', isShow);

  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default BidExtractorWizard;