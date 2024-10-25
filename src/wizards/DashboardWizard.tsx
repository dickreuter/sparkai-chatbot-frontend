import React, { useState, useEffect, useRef } from "react";
import CustomWizard from "./CustomWizard";

const DashboardWizard = () => {
  const [isShow, setIsShow] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const steps = [
    {
      elementId: "dashboard-title",
      title: "Dashboard",
      description:
        "Welcome to your Dashboard 👋 Here you can manage all your bids.",
      position: ""
    },

    {
      elementId: "sort-options",
      title: "Sort Options",
      description: "Sort your bids by last edited date or submission deadline.",
      position: ""
    },
    {
      elementId: "new-bid-button",
      title: "Create New Bid",
      description:
        "📝 Ready to start something new? Click here to create a new bid.",
      position: ""
    },
    {
      elementId: "bids_table",
      title: "Bids Table",
      description:
        "Here’s where all your bids live 📋 Click on a bid title to view or make changes to it."
    },
    {
      elementId: "status-dropdown",
      title: "Bid Status",
      description: "Change the status of your bid here."
    },
    {
      elementId: "showtips",
      title: "Show Tips? ",
      description:
        "Forgot how something works? No problem! Click here anytime to replay this tour. 🔄",
      position: "down"
    }
  ];

  useEffect(() => {
    const checkTourStatus = () => {
      const tourCompleted = localStorage.getItem("dashboardTourCompleted");
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
    localStorage.setItem("dashboardTourCompleted", "true");
  };

  return (
    <div className="dashboard-wizard-wrapper">
      <CustomWizard steps={steps} isShow={isShow} onClose={handleClose} />
    </div>
  );
};

export default DashboardWizard;
