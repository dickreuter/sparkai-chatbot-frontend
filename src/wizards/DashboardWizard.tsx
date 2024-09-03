import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const DashboardWizard = () => {
  const [isShow, setIsShow] = useState(true);

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
    const isFirstVisit = localStorage.getItem('dashboardTourCompleted') !== 'true';
    setIsShow(isFirstVisit);
  }, []);

  const handleClose = () => {
    setIsShow(false);
    localStorage.setItem('dashboardTourCompleted', 'true');
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

export default DashboardWizard;