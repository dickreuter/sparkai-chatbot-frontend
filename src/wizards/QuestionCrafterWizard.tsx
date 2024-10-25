import React, { useState, useEffect } from "react";
import Wizard from "react-onboarding";
import CustomWizard from "./CustomWizard";

const QuestionCrafterWizard = () => {
  const [isShow, setIsShow] = useState(false);

  const steps = [
    {
      elementId: "question-section",
      title: "Question Section",
      description:
        "Where the magic happens🪄 Enter your question here pick and folder from your content library to narrow down the search."
    },
    {
      elementId: "select-folder",
      title: "Knowledge Base Selection",
      description:
        "Click this button to select folders from your content library 📂 The AI will use these as its knowledge base when answering your questions. "
    },
    {
      elementId: "answer-section",
      title: "Answer Section",
      description:
        "Your answer will appear here. Need to tweak it? No problem! You can edit and perfect the response to fit your needs."
    },
    {
      elementId: "bid-pilot-section",
      title: "Bid Pilot",
      description:
        "Meet Bid Pilot, your AI sidekick! 🤖 Need help refining answers or tackling tricky questions? Highlight some text in the answer to use prompts. "
    },
    {
      elementId: "bid-pilot-options",
      title: "Bid Pilot Options",
      description:
        "Choose between Internet Search and Library Chat for different types of assistance."
    },
    {
      elementId: "qa-sheet-selector",
      title: "Q&A Sheet",
      description:
        "Finished with the question? Select a Q&A sheet to add the question and answer to your bid compiler.",
      position: "down"
    }
  ];

  useEffect(() => {
    const checkTourStatus = () => {
      const tourCompleted = localStorage.getItem(
        "questionCrafterTourCompleted"
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
    localStorage.setItem("questionCrafterTourCompleted", "true");
  };

  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default QuestionCrafterWizard;
