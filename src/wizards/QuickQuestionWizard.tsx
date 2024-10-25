import React, { useState, useEffect } from "react";
import Wizard from "react-onboarding";
import CustomWizard from "./CustomWizard";

const QuickQuestionWizard = () => {
  const [isShow, setIsShow] = useState(false);

  const steps = [
    {
      elementId: "welcome",
      title: "Quick Question",
      description:
        "Welcome to the Q&A chat. This is your go-to spot for asking questions about your Content Library. Fire away!"
    },
    {
      elementId: "clear",
      title: "Clear Chat",
      description:
        "Need a fresh start?  To clear your chat, click this trash can button 🗑️ "
    }
  ];

  useEffect(() => {
    const checkTourStatus = () => {
      const tourCompleted = localStorage.getItem(
        "quickquestionWizardTourCompleted"
      );
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
    localStorage.setItem("quickquestionWizardTourCompleted", "true");
  };

  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default QuickQuestionWizard;
