import React, { useState, useEffect } from "react";
import Wizard from "react-onboarding";
import CustomWizard from "./CustomWizard";

const BidExtractorWizard = () => {
  const [isShow, setIsShow] = useState(false);

  const steps = [
    {
      elementId: "proposal-header",
      title: "Bid Title",
      description:
        'This is the title of your bid. You can edit it by clicking the "edit" button.',
      position: "down"
    },
    {
      elementId: "contributors-card",
      title: "Contributors",
      description:
        "Teamwork makes the dream work! 🚀 View and manage the contributors to this bid. Add users from your organisation to work on this bid.",
      position: "left"
    },
    {
      elementId: "opportunity-information-card",
      title: "Auto Extraction",
      description:
        "Extract the Opportunity Information and Compliance Requirements for your bid automatically using the tool icon. Our AI will use documents in your Tender Library as context.",
      position: "farleft"
    },
    {
      elementId: "tender-library",
      title: "Tender Library",
      description:
        "Manage and view documents related to this bid in the Tender Library.",
      position: "down"
    }
  ];

  useEffect(() => {
    const checkTourStatus = () => {
      const tourCompleted = localStorage.getItem("bidExtractorTourCompleted");
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
    localStorage.setItem("bidExtractorTourCompleted", "true");
    s;
  };

  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default BidExtractorWizard;
