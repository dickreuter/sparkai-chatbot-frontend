import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const LibraryWizard = () => {
  const [isShow, setIsShow] = useState(true);

  const rule = [
    {
      elementId: 'library-title',
      title: 'Content Library',
      description: 'Welcome to your Content Library! Here you can manage all your folders and documents. Click New Folder to get started.',
    },
    {
      elementId: 'search-bar-container',
      title: 'Search',
      description: 'Use this search bar to quickly find folders and files across your library.',
    },
    {
      elementId: 'library-table',
      title: 'Resources',
      description: 'This table displays your folders and files. Click on a folder to view its contents or click the three dots to upload a file.',
    },

  ];

  useEffect(() => {
    const isFirstVisit = localStorage.getItem('libraryTourCompleted') !== 'true';
    setIsShow(isFirstVisit);
  }, []);

  const handleClose = () => {
    setIsShow(false);
    localStorage.setItem('libraryTourCompleted', 'true');
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

export default LibraryWizard;