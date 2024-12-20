import {
  faFileUpload,
  faListUl,
  faEdit,
  faCloudUploadAlt,
  faSpinner,
  faCheck,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useRef, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { displayAlert } from "../helper/Alert";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import { useAuthUser } from "react-auth-kit";
import SelectFolder from "../components/SelectFolder";
import { BidContext } from "../views/BidWritingStateManagerView";
import SelectTenderLibraryFile from "../components/SelectTenderLibraryFile";
import { LinearProgress, Typography, Box } from "@mui/material";

const OutlineInstructionsModal = ({ show, onHide, bid_id, fetchOutline }) => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState, setSharedState } = useContext(BidContext);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState(
    sharedState.selectedFolders || []
  );
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(
    "Analyzing tender documents..."
  );
  const progressInterval = useRef(null);

  const loadingMessages = [
    // Initial Analysis
    "Analyzing tender documents...",
    "Extracting key requirements...",
    "Scanning compliance criteria...",
    "Identifying mandatory requirements...",

    // Opportunity Analysis
    "Analyzing market opportunity...",
    "Evaluating competitive landscape...",
    "Identifying key differentiators...",
    "Assessing strategic advantages...",
    "Analyzing win probability factors...",

    // Compliance Processing
    "Processing compliance matrix...",
    "Mapping regulatory requirements...",
    "Validating certification needs...",
    "Checking accreditation requirements...",
    "Analyzing quality standards...",
    "Reviewing safety requirements...",
    "Checking environmental compliance...",

    // Structure Building
    "Building section framework...",
    "Organizing content hierarchy...",
    "Structuring response format...",
    "Creating section dependencies...",
    "Mapping cross-references...",

    // Requirements Processing
    "Processing technical requirements...",
    "Analyzing scope requirements...",
    "Evaluating delivery timelines...",
    "Mapping resource requirements...",
    "Assessing risk factors...",

    // Evaluation Criteria
    "Analyzing evaluation criteria...",
    "Mapping scoring elements...",
    "Identifying critical success factors...",
    "Processing weighted criteria...",
    "Validating scoring mechanisms...",

    // Value Proposition
    "Analyzing value propositions...",
    "Identifying unique selling points...",
    "Mapping innovation opportunities...",
    "Processing strategic benefits...",

    // Documentation
    "Structuring executive summary...",
    "Organizing methodology sections...",
    "Mapping past performance requirements...",
    "Processing capability statements...",

    // Quality Checks
    "Validating section flow...",
    "Checking requirement coverage...",
    "Verifying compliance alignment...",
    "Reviewing structural integrity...",

    // Financial Elements
    "Analyzing pricing requirements...",
    "Mapping cost breakdown structure...",
    "Reviewing payment milestones...",
    "Checking financial criteria...",

    // Social Value
    "Processing social value requirements...",
    "Analyzing community benefits...",
    "Mapping sustainability requirements...",
    "Evaluating environmental impact...",

    // Final Steps
    "Optimizing outline structure...",
    "Finalizing section ordering...",
    "Validating completeness...",
    "Performing final compliance check...",
    "Generating final outline format... Please wait a little bit longer..."
  ];

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
    const duration = 60000; // 1 minute in ms
    const interval = 100;
    const steps = duration / interval;
    const increment = 98 / steps;

    let currentProgress = 0;
    let messageIndex = 0;

    const messageRotationInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 1000);

    progressInterval.current = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 98) {
        clearInterval(progressInterval.current);
        clearInterval(messageRotationInterval);
        if (!isGeneratingOutline) {
          setProgress(100);
          setLoadingMessage("Finalizing outline structure...");
        } else {
          setProgress(98);
        }
      } else {
        setProgress(currentProgress);
      }
    }, interval);
  };

  const handleFileSelection = (files) => {
    console.log("Files selected in SelectTenderLibraryFile component:", files);
    setSelectedFiles(files);
  };

  const handleFolderSelection = (folders) => {
    console.log("Folders selected in SelectFolder component:", folders);
    setSelectedFolders(folders);
    setSharedState((prevState) => ({
      ...prevState,
      selectedFolders: folders
    }));
  };

  const generateOutline = async () => {
    if (isGeneratingOutline) return;

    setIsGeneratingOutline(true);
    startProgressBar();
    console.log(bid_id);
    console.log(sharedState.selectedFolders);
    console.log(selectedFiles);
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/generate_outline`,
        {
          bid_id: bid_id,
          extra_instructions: "",
          datasets: sharedState.selectedFolders,
          file_names: selectedFiles
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      setCurrentStep(4);
      await fetchOutline();
    } catch (err) {
      console.error("Full error:", err.response?.data);
      if (err.response?.status === 404) {
        displayAlert("No documents found in the tender library.", "warning");
      } else {
        displayAlert("Failed to generate outline", "danger");
      }
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedFiles.length === 0) {
        displayAlert("Please select at least one document", "warning");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      generateOutline();
    } else if (currentStep === 4) {
      onHide();
    }
  };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      onCancel();
    }
  };

  const getButtonLabel = () => {
    switch (currentStep) {
      case 1:
        return "Next";
      case 2:
        return "Continue";
      case 3:
        return isGeneratingOutline ? (
          <>
            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
            Generating...
          </>
        ) : (
          "Generate"
        );
      case 4:
        return "Finish";
      default:
        return "Next";
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="px-4 py-2">
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <div
                className="text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                  backgroundColor: "#FF8C00"
                }}
              >
                1
              </div>
              <div className="ms-3">
                <h6 className="mb-1">Select Tender Questions Document</h6>
                <p className="text-muted mb-0">
                  First, select the tender question document as the outline will
                  extract the questions from here
                  <FontAwesomeIcon icon={faFileUpload} className="ms-2" />
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center mb-3">
              <div
                className="text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                  backgroundColor: "#FF8C00"
                }}
              >
                2
              </div>
              <div className="ms-3">
                <h6 className="mb-1">Select Company Library Docs</h6>
                <p className="text-muted mb-0">
                  Select previous bids from your company library to use as
                  context.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center">
              <div
                className="text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                  backgroundColor: "#FF8C00"
                }}
              >
                3
              </div>
              <div className="ms-3">
                <h6 className="mb-1">Generate Outline</h6>
                <p className="text-muted mb-0">
                  Click the button below to automatically generate your proposal
                  outline based on the tender questions.
                  <FontAwesomeIcon icon={faEdit} className="ms-2" />
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (currentStep === 2) {
      return (
        <div className="px-4 py-2">
          <p>
            Select the documents which contain the questions you need to answer
            in your bid. These will be used to generate the outline for your
            proposal.
          </p>
          <div className="selectfolder-container mt-0 p-0">
            <SelectTenderLibraryFile
              bid_id={bid_id}
              onFileSelect={handleFileSelection}
              initialSelectedFiles={selectedFiles}
            />
          </div>
          <div
            className="alert alert-info"
            style={{
              backgroundColor: "rgba(255, 140, 0, 0.08)",
              border: "1px solid #FF8C00",
              color: "#FF8C00"
            }}
          >
            <strong>Note:</strong> Please verify your selections before
            proceeding. The outline will be generated based on the selected
            documents.
          </div>
        </div>
      );
    } else if (currentStep === 3) {
      return (
        <div className="px-4 py-2">
          <div className="px-3">
            Select the folders below from your content library to use as context
            in your final proposal. The AI will be able to use information from
            these when generating an answer.
          </div>

          <div className="selectfolder-container mt-3">
            <SelectFolder
              onFolderSelect={handleFolderSelection}
              initialSelectedFolders={selectedFolders}
            />
          </div>

          {isGeneratingOutline && (
            <div className="mt-4">
              <LinearProgressWithLabel
                value={progress}
                message={loadingMessage}
              />
            </div>
          )}
        </div>
      );
    } else if (currentStep === 4) {
      return (
        <div className="px-4">
          <h4 className="mb-3">
            Outline Generated Successfully
            <FontAwesomeIcon
              icon={faCheck}
              className="text-success"
              style={{ fontSize: "26px", marginLeft: "10px" }}
            />
          </h4>
          <p className="text-muted">
            Your outline has been created based on your tender question
            documents.
          </p>

          <div className="bg-gray-50 rounded-lg p-6">
            <h5 className="text-gray-600 mb-0">Next Steps:</h5>
            <ol style={{ padding: "12px", paddingBottom: "0px" }}>
              <li>
                <strong>Review Questions:</strong>
                <p className="text-muted mb-2">
                  Check that all questions extracted match your tender
                  questions. You can edit these in the sidepane by clicking on a
                  section or add new sections by right clicking on a row in the
                  table.
                </p>
              </li>
              <li>
                <strong>Start Writing:</strong>
                <p className="text-muted">
                  If you want to add more detail to a section, click on the
                  section to show the sidepane. This will let you add talking
                  points you want the AI to cover in the final proposal for that
                  section.
                </p>
              </li>
              <li>
                <strong>Create Proposal</strong>
                <p className="text-muted mb-2">
                  Click the Create Proposal button to generate a proposal. Once
                  your proposal has been generated you can go to the Preview
                  Proposal tab to download it as a word document.
                </p>
              </li>
            </ol>
          </div>
        </div>
      );
    }
  };

  const onCancel = () => {
    if (!sharedState.outline || sharedState.outline.length === 0) {
      navigate("/bid-extractor");
    } else {
      onHide();
    }
  };

  const getHeaderTitle = () => {
    if (currentStep === 1) {
      return "Instructions";
    }
    return `Step ${currentStep - 1} of 3`;
  };

  return (
    <Modal show={show} onHide={onCancel} size="lg" centered>
      <Modal.Header className="px-4 d-flex justify-content-between align-items-center">
        <Modal.Title>{getHeaderTitle()}</Modal.Title>
        <button className="close-button ms-auto" onClick={onCancel}>
          ×
        </button>
      </Modal.Header>
      <Modal.Body className="p-2">{renderStepContent()}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleBack}>
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        <Button
          className="upload-button"
          onClick={handleNext}
          disabled={
            (currentStep === 2 && selectedFiles.length === 0) ||
            isGeneratingOutline
          }
        >
          {getButtonLabel()}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OutlineInstructionsModal;
