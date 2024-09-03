import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const DashboardWizard = () => {
  console.log('DashboardWizard component rendering');
 
  const [isShow, setIsShow] = useState(false);
  console.log('Initial isShow state:', isShow);

  const rule = [
    {
      elementId: 'dashboard-title',
      title: 'Dashboard',
      description: 'Welcome to your Dashboard! Here you can manage all your bids.',
    },
    {
      elementId: 'sort-options',
      title: 'Sort Options',
      description: 'Sort your bids by last edited date or submission deadline.',
    },
    {
      elementId: 'new-bid-button',
      title: 'Create New Bid',
      description: 'Click here to create a new bid.',
    },
    {
      elementId: 'bids-table',
      title: 'Bids Table',
      description: 'This table shows all your bids. Click on a bid title to view or edit it.',
    },
    {
      elementId: 'status-dropdown',
      title: 'Bid Status',
      description: 'Change the status of your bid here.',
    }
  ];

  useEffect(() => {
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('dashboardTourCompleted');
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
    localStorage.setItem('dashboardTourCompleted', 'true');
    console.log('dashboardTourCompleted set to true in localStorage');
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
      {!isShow && <div>Wizard is not shown</div>}
    </>
  );
};

export default DashboardWizard;