import React, { useState, useEffect } from "react";
import Wizard from "react-onboarding";
import CustomWizard from "./CustomWizard";

const LibraryWizard = () => {
  const [isShow, setIsShow] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const steps = [
    {
      elementId: "library-title",
      title: "Content Library",
      description:
        "Welcome to your Content Library! 🎉 This is your knowledge hub where you can organise and access all your important documents and folders."
    },
    {
      elementId: "search-bar-container",
      title: "Quick Search",
      description:
        "Looking for something specific? Use this search bar to find folders and files quickly 🔍",
      position: "right"
    },
    {
      elementId: "library-table",
      title: "Resources",
      description:
        "Browse your folders and files, click to open, or use the ⋮ menu to upload new files.",
      position: "left"
    },
    {
      elementId: "new-folder",
      title: "New Folder",
      description:
        "Ready to get organized? Click here to create a new folder and start structuring your content like a pro! 🚀"
    }
  ];

  useEffect(() => {
    const checkTourStatus = () => {
      const tourCompleted = localStorage.getItem("libraryTourCompleted");
      setIsShow(tourCompleted === "false");
    };

    // Check initial status
    checkTourStatus();

    // Listen for the custom event
    const handleShowTips = () => {
      checkTourStatus();
    };

    window.addEventListener("showTips", handleShowTips);

    // Cleanup
    return () => {
      window.removeEventListener("showTips", handleShowTips);
    };
  }, []);

  const handleClose = () => {
    setIsShow(false);
    localStorage.setItem("libraryTourCompleted", "true");
  };

  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default LibraryWizard;
