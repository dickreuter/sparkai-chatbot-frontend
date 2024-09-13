import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";
import CustomWizard from './CustomWizard';

const LibraryWizard = () => {
  const [isShow, setIsShow] = useState(false);
  const [isReady, setIsReady] = useState(false);


  const steps = [
    {
      elementId: 'library-title',
      title: 'Content Library',
      description: 'Welcome to your Content Library! 🎉 This is your knowledge hub where you can organise and access all your important documents and folders.',
    },
    {
      elementId: 'search-bar-container',
      title: 'Quick Search',
      description: 'Looking for something specific? Use this search bar to find folders and files quickly 🔍',
      position: 'down'
    },
    {
      elementId: 'library-table',
      title: 'Resources',
      description: "Browse your folders and files, click to open, or use the ⋮ menu to upload new files.",
      position: "left"
    },
    {
      elementId: 'new-folder',
      title: 'New Folder',
      description: 'Ready to get organized? Click here to create a new folder and start structuring your content like a pro! 🚀',
    }
  ];

  useEffect(() => {
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('libraryTourCompleted');
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
    localStorage.setItem('libraryTourCompleted', 'true');
    console.log('libraryTourCompleted set to true in localStorage');
  };

  console.log('Rendering Wizard with isShow:', isShow);

  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default LibraryWizard;