import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const BidExtractorWizard = () => {
  console.log('BidExtractorWizard component rendering');

  const [isShow, setIsShow] = useState(false);
  console.log('Initial isShow state:', isShow);

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
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('bidExtractorTourCompleted');
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
    localStorage.setItem('bidExtractorTourCompleted', 'true');
    console.log('bidExtractorTourCompleted set to true in localStorage');
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
          isScrollToElement={true}
        />
      )}
      {!isShow && <div style={{ display: 'none' }}>Wizard is not shown</div>}
    </>
  );
};

export default BidExtractorWizard;