import React, { useState, useEffect, useRef } from 'react';
import CustomWizard from './CustomWizard';


const DashboardWizard = () => {
  const [isShow, setIsShow] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const steps = [
    {
      elementId: 'dashboard-title',
      title: 'Dashboard',
      description: 'Welcome to your Dashboard 👋 Here you can manage all your bids.',
      position: ''
    },
    
    {
      elementId: 'sort-options',
      title: 'Sort Options',
      description: 'Sort your bids by last edited date or submission deadline.',
      position: 'left',
    },
    {
      elementId: 'new-bid-button',
      title: 'Create New Bid',
      description: '📝 Ready to start something new? Click here to create a new bid.',
      position: 'left',
    },
    {
      elementId: 'bids-table',
      title: 'Bids Table',
      description: 'Here’s where all your bids live 📋 Click on a bid title to view or make changes to it.',
    },
    {
      elementId: 'status-dropdown',
      title: 'Bid Status',
      description: 'Change the status of your bid here.',
    },
    {
      elementId: 'showtips',
      title: 'Show Tips? ',
      description: 'Forgot how something works? No problem! Click here anytime to replay this tour. 🔄',
      position: 'down',
    }
  ];

  useEffect(() => {
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('dashboardTourCompleted');
    console.log('tourCompleted value from localStorage:', tourCompleted);

    if (tourCompleted === 'false') {
      console.log('Tour not completed, setting isShow to true');
      setIsShow(true);
    } else {
      console.log('Tour already completed, isShow remains false');
    }
  }, []);

  const handleClose = () => {
    setIsShow(false);
    localStorage.setItem('dashboardTourCompleted', 'true');
  };


  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default DashboardWizard;