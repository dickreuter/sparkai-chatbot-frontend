import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const BidExtractorWizard = () => {
  const [isShow, setIsShow] = useState(true);

  const rule = [
    {
      elementId: 'proposal-header',
      title: 'Bid Title',
      description: 'This is the title of your bid. You can edit it by clicking the "edit" button.',
    },
    {
      elementId: 'contributors-card',
      title: 'Contributors',
      description: 'View and manage the contributors to this bid. Add users from your organisation to work on this bid.',
    },
    {
      elementId: 'opportunity-information-card',
      title: 'Opportunity Information',
      description: 'Generate the Opportunity Information for your bid automatically using the tool icon. Our AI will use documents in your Tender Library as context.',
    },
    {
      elementId: 'tender-library',
      title: 'Tender Library',
      description: 'Manage and view documents related to this bid in the Tender Library.',
    }
  ];

  useEffect(() => {
    const isFirstVisit = localStorage.getItem('bidExtractorTourCompleted') !== 'true';
    setIsShow(isFirstVisit);
  }, []);

  const handleClose = () => {
    setIsShow(false);
    localStorage.setItem('bidExtractorTourCompleted', 'true');
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

export default BidExtractorWizard;