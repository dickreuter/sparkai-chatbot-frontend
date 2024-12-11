import React, { useState, useEffect, useRef, useContext } from "react";
import { Modal, Button } from "react-bootstrap";
import SelectFolder from "../components/SelectFolder";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import {
  faRocket,
  faSpinner,
  faWarning
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BidContext } from "../views/BidWritingStateManagerView";
import { LinearProgress, Typography, Box } from "@mui/material";

const GenerateProposalModal = ({ bid_id, outline }) => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const navigate = useNavigate();
  const { sharedState, setSharedState } = useContext(BidContext);
  const [currentStep, setCurrentStep] = useState(1);
  const tokenRef = useRef(auth?.token || "default");
  const [show, setShow] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Analyzing tender requirements..."
  );

  const loadingMessages = [
    "Analyzing tender requirements...",
    "Cross-checking with company library...",
    "Mining past successful proposals...",
    "Evaluating win themes...",
    "Calculating competitive advantages...",
    "Identifying key differentiators...",
    "Structuring executive summary...",
    "Crafting value propositions...",
    "Optimizing technical approach...",
    "Enhancing solution architecture...",
    "Polishing management strategy...",
    "Fine-tuning pricing strategy...",
    "Adding compelling case studies...",
    "Incorporating best practices...",
    "Validating compliance requirements...",
    "Optimizing proposal language...",
    "Adding winning elements...",
    "Performing quality checks...",
    "Enhancing visual elements...",
    "Reviewing risk mitigation strategies...",
    "Finalizing implementation approach...",
    "Double-checking all requirements...",
    "Polishing final draft...",
    "Downloading additional information...",
    "Resolving any remaining issues...",
    "Analyzing market positioning...",
    "Refining unique selling points...",
    "Strengthening past performance examples...",
    "Enhancing capability statements...",
    "Optimizing resource allocation plans...",
    "Validating delivery timelines...",
    "Incorporating sustainability measures...",
    "Detailing quality assurance processes...",
    "Enhancing innovation descriptions...",
    "Polishing methodology sections...",
    "Refining cost breakdowns...",
    "Adding social value elements...",
    "Strengthening local content details...",
    "Validating certification requirements...",
    "Enhancing team credentials...",
    "Optimizing project schedules..."
  ];

  const incompleteSections =
    outline?.filter((section) => section.status !== "Completed") || [];
  const hasIncompleteSections = incompleteSections.length > 0;

  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);

  function LinearProgressWithLabel(props) {
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}
      >
        <Box sx={{ width: "100%", mr: 1 }}>
          <LinearProgress
            variant="determinate"
            {...props}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: "#ffd699",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#ff9900"
              }
            }}
          />
        </Box>
        <Box sx={{ minWidth: 35, mt: 1, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(props.value)}%`}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            {props.message}
          </Typography>
        </Box>
      </Box>
    );
  }

  const startProgressBar = () => {
    const duration = 180000; // 3:00 minutes in ms
    const interval = 100; // Update every 100ms
    const steps = duration / interval;
    const increment = 98 / steps;

    let currentProgress = 0;
    let messageIndex = 0;

    const messageRotationInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 1000); // Changed from 3000 to 1000 to rotate every second

    progressInterval.current = setInterval(() => {
      currentProgress += increment;

      if (currentProgress >= 98) {
        clearInterval(progressInterval.current);
        clearInterval(messageRotationInterval);
        if (!isGeneratingProposal) {
          setProgress(100);
          setLoadingMessage(
            "Post processing final document.... Document will be downloaded shortly..."
          );
        } else {
          setProgress(98);
        }
      } else {
        setProgress(currentProgress);
      }
    }, interval);
  };

  const generateProposal = async () => {
    try {
      setIsGeneratingProposal(true);
      startProgressBar();
      console.log(sharedState.selectedFolders);

      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/generate_proposal`,
        {
          bid_id: bid_id,
          extra_instructions: "",
          datasets: sharedState.selectedFolders
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          },
          responseType: "blob"
        }
      );

      const blob = new Blob([response.data], { type: "application/msword" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download =
        response.headers["content-disposition"]?.split("filename=")[1] ||
        "proposal.docx";
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      setProgress(60);
      handleClose();
    } catch (err) {
      console.error("Error generating proposal:", err);
    } finally {
      clearInterval(progressInterval.current);
      setIsGeneratingProposal(false);
    }
  };

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setCurrentStep(1);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      generateProposal();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      handleClose();
    }
  };

  const getButtonLabel = () => {
    if (isGeneratingProposal) {
      return (
        <>
          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
          Processing...
        </>
      );
    }
    return "Generate Proposal";
  };

  const getHeaderTitle = () => {
    return "Generate Proposal";
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="px-2 py-4">
          <div className="px-3">
            <p>
              Only sections marked as complete will be used to generate the
              proposal. The proposal will be generated as a Word document that
              you can then edit and format as needed.
            </p>
            {hasIncompleteSections && (
              <>
                <div className="mt-3 text-warning">
                  <FontAwesomeIcon icon={faWarning} className="me-2" />
                  There are {incompleteSections.length} incomplete sections:
                </div>
                <div
                  className="mt-2 border rounded p-3 bg-light"
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto"
                  }}
                >
                  <ul className="list-unstyled mb-0">
                    {incompleteSections.map((section, index) => (
                      <li
                        key={index}
                        className="mb-2 d-flex justify-content-between align-items-center"
                      >
                        <span className="fw-medium">{section.heading}</span>
                        <FontAwesomeIcon icon={faWarning} className="me-2" />
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {isGeneratingProposal && (
              <div className="mt-4">
                <LinearProgressWithLabel
                  value={progress}
                  message={loadingMessage}
                />
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <button className="orange-button" onClick={handleShow}>
        <FontAwesomeIcon icon={faRocket} className="pr-2"></FontAwesomeIcon>
        Generate Proposal
      </button>
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header className="p-4">
          <Modal.Title>{getHeaderTitle()}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">{renderStepContent()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleBack}>
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>
          <Button
            className="upload-button"
            onClick={handleNext}
            disabled={isGeneratingProposal}
          >
            {getButtonLabel()}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GenerateProposalModal;
