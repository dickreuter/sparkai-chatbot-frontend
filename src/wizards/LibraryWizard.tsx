import React, { useState, useEffect } from 'react';
import Wizard from "react-onboarding";

const LibraryWizard = () => {
  console.log('LibraryWizard component rendering');

  const [isShow, setIsShow] = useState(false);
  console.log('Initial isShow state:', isShow);

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
    console.log('useEffect running');
    const tourCompleted = localStorage.getItem('libraryTourCompleted');
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
    localStorage.setItem('libraryTourCompleted', 'true');
    console.log('libraryTourCompleted set to true in localStorage');
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

export default LibraryWizard;