import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import handleGAEvent from "../utilities/handleGAEvent";
import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./QuestionsCrafter.css";
import { Editor, EditorState, convertToRaw, ContentState } from "draft-js";
import "draft-js/dist/Draft.css";
import {
  BidContext,
  Section,
  Subheading
} from "./BidWritingStateManagerView.tsx";
import { useLocation, useNavigate } from "react-router-dom";
import { displayAlert } from "../helper/Alert.tsx";
import StatusMenu from "../components/StatusMenu.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import SectionTitle from "../components/SectionTitle.tsx";
import { IconButton, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

const QuestionCrafter = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const location = useLocation();
  const { bid_id, section: locationSection } = location.state || {};
  const { sharedState, setSharedState, getBackgroundInfo } =
    useContext(BidContext);
  const { contributors, outline } = sharedState;

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [section, setCurrentSection] = useState(() => {
    const sectionId = locationSection?.section_id;
    return outline.find((s) => s.section_id === sectionId) || locationSection;
  });

  const backgroundInfo = getBackgroundInfo();
  const [inputText, setInputText] = useState(section.question || "");

  const currentUserPermission = contributors[auth.email] || "viewer"; // Default to 'viewer' if not found
  const canUserEdit =
    currentUserPermission === "admin" || currentUserPermission === "editor";

  /////////////////////////////////////////////////////////////////////////////////////////////

  const [choice, setChoice] = useState("3");
  const [broadness, setBroadness] = useState("4");

  const [sectionStatus, setSectionStatus] = useState(section.status);
  const [isLoadingSubheadings, setIsLoadingSubheadings] = useState(false);

  const navigate = useNavigate();

  //timer for adding new subesections

  // Set initial section index from the passed section
  // Modify this useEffect
  useEffect(() => {
    const currentSection = outline.find(
      (s) => s.section_id === section.section_id
    );
  }, [section.section_id]); // Only depend on section.section_id, not outline

  const navigateToSection = async (targetSection: Section) => {
    try {
      // If the user has edit permissions AND the current section's question has changed,
      // we need to save those changes before navigating away
      if (canUserEdit && inputText !== section.question) {
        // Create a new outline array where we update the current section's question
        // with the latest input text, leaving all other sections unchanged
        const updatedOutline = outline.map((s) =>
          s.section_id === section.section_id
            ? { ...s, question: inputText }
            : s
        );

        // Update the shared state with the new outline
        // We wrap this in a Promise to ensure the state update completes
        // before proceeding with navigation
        await new Promise<void>((resolve) => {
          setSharedState((prev) => {
            resolve(); // Signal that the state update is complete
            return {
              ...prev,
              outline: updatedOutline
            };
          });
        });
      }

      // Update the local state to reflect the target section we're navigating to
      setCurrentSection(targetSection);

      // Reset all section-specific states for the new section:
      // - Set the status display to match the target section
      setSectionStatus(targetSection.status);
      // - Update the input field with the target section's question
      setInputText(targetSection.question || "");

      // Find the index of the target section in the overall outline
      // This is used for navigation between sections (prev/next)
      const newIndex = outline.findIndex(
        (s) => s.section_id === targetSection.section_id
      );
      if (newIndex !== -1) {
        setCurrentSectionIndex(newIndex);
      }

      // Finally, use React Router to navigate to the question-crafter page
      // Pass the target section and bid_id as state for the new route
      navigate("/question-crafter", {
        state: {
          section: targetSection,
          bid_id: bid_id
        }
      });
    } catch (error) {
      // If anything goes wrong during the navigation process,
      // log the error and show an alert to the user
      console.error("Error navigating to section:", error);
      displayAlert("Failed to navigate to section", "danger");
    }
  };

  const handlePreviousSection = async () => {
    if (currentSectionIndex > 0) {
      await navigateToSection(outline[currentSectionIndex - 1]);
    }
  };

  const handleNextSection = async () => {
    if (currentSectionIndex < outline.length - 1) {
      await navigateToSection(outline[currentSectionIndex + 1]);
    }
  };

  const showViewOnlyMessage = () => {
    console.log(currentUserPermission);
    displayAlert("You only have permission to view this bid.", "danger");
  };

  // Modify the input text change handler
  const handleInputTextChange = (e) => {
    const newText = e.target.value;
    setInputText(newText);

    if (canUserEdit) {
      // Update shared state
      const updatedOutline = outline.map((s) =>
        s.section_id === section.section_id ? { ...s, question: newText } : s
      );

      setSharedState((prev) => ({
        ...prev,
        outline: updatedOutline
      }));
    }
  };

  const sendQuestionToChatbot = async () => {
    handleGAEvent("Chatbot", "Submit Question", "Submit Button");
    setQuestionAsked(true);
    localStorage.setItem("questionAsked", "true");
    setIsLoading(true);
    setStartTime(Date.now());
    setElapsedTime(0);

    console.log("Starting question request with:", {
      inputText,
      backgroundInfo
    });

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: choice === "3" ? "3a" : choice,
          broadness: broadness,
          input_text: inputText,
          extra_instructions: backgroundInfo,
          datasets: sharedState.selectedFolders,
          bid_id: sharedState.object_id
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );

      console.log("Received response:", result.data);

      let choicesArray = [];

      try {
        // First, try splitting by semicolons
        if (result.data && result.data.includes(";")) {
          choicesArray = result.data.split(";").map((choice) => choice.trim());
        }

        // If semicolon splitting didn't work, try parsing as a numbered list
        if (choicesArray.length === 0 && typeof result.data === "string") {
          choicesArray = result.data
            .split("\n")
            .filter((line) => /^\d+\./.test(line.trim()))
            .map((line) => line.replace(/^\d+\.\s*/, "").trim());
        }

        console.log("Parsed choices:", choicesArray);

        if (choicesArray.length === 0) {
          throw new Error("Failed to parse API response into choices");
        }
      } catch (error) {
        console.error("Error processing API response:", error);
      }

      setApiChoices(choicesArray);
    } catch (error) {
      console.error("Error sending question:", error);
    } finally {
      setIsLoading(false);
      setStartTime(null); // Reset start time when done
    }
  };

  const updateStatus = async (status: string) => {
    try {
      // Update both local and shared state
      setSectionStatus(status);

      const updatedOutline = outline.map((s) =>
        s.section_id === section.section_id ? { ...s, status } : s
      );

      setSharedState((prev) => ({
        ...prev,
        outline: updatedOutline
      }));
    } catch (err) {
      console.error("Error updating status:", err);
      setSectionStatus(section.status);
      displayAlert("Failed to update status", "danger");
    }
  };

  return (
    <div className="chatpage">
      <SideBarSmall />

      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar />

          <div>
            <Row
              className="justify-content-md-center"
              style={{ visibility: "hidden", height: 0, overflow: "hidden" }}
            ></Row>

            <Col md={12}>
              <div className="proposal-header mt-3 mb-3">
                <SectionTitle
                  canUserEdit={canUserEdit}
                  displayAlert={displayAlert}
                  showViewOnlyMessage={showViewOnlyMessage}
                  sectiontitle={section.heading}
                  section={section}
                  sectionIndex={currentSectionIndex}
                  bid_id={bid_id}
                  tokenRef={tokenRef}
                />
                <StatusMenu
                  value={sectionStatus} // Use the local state instead of section.status
                  onChange={(value) => updateStatus(value)}
                />
              </div>
              <div className="d-flex align-items-center mb-2">
                <h1 className="lib-title me-2" id="question-section">
                  Question
                </h1>
                <div className="d-flex justify-content-between align-items-center gap-1 mb-2">
                  <button
                    onClick={handlePreviousSection}
                    disabled={currentSectionIndex === 0}
                    className="navigation-button"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <div className="text-muted">
                    Section {currentSectionIndex + 1} of {outline.length}
                  </div>
                  <button
                    onClick={handleNextSection}
                    disabled={currentSectionIndex === outline.length - 1}
                    className="navigation-button"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              </div>

              <div className="question-answer-box">
                <textarea
                  className="card-textarea"
                  placeholder="Enter question here..."
                  value={inputText}
                  onChange={handleInputTextChange}
                  disabled={!canUserEdit}
                ></textarea>
              </div>
              <div className="text-muted mt-2">
                Word Count: {inputText.split(/\s+/).filter(Boolean).length}
              </div>

              <Row className="mt-4 mb-0">
                <Col md={12}>
                  <Card className="mb-2 custom-grey-border">
                    <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                      <div style={{ display: "flex" }}>
                        <h1 className="requirements-title">Answer Preview</h1>
                        <Tooltip
                          placement="top"
                          title="This is a preview of what your answer will look like so you can decide which subheadings you want to include and make changes to your writitng plan."
                          arrow
                        >
                          <IconButton
                            size="medium"
                            style={{
                              padding: 0
                              // Fine-tune vertical alignment with the header
                            }}
                            className="ms-1"
                          >
                            <InfoIcon fontSize="medium" color="action" />
                          </IconButton>
                        </Tooltip>
                      </div>

                      <div className="text-muted" style={{ marginBottom: "0" }}>
                        Word Count:{" "}
                        {section.answer.split(/\s+/).filter(Boolean).length}
                      </div>
                    </Card.Header>
                    <Card.Body className="px-0 py-1">
                      <textarea
                        className="form-control requirements-textarea"
                        placeholder="Click the tool icon to extract opportunity information from your tender documents..."
                        value={section.answer}
                        disabled={true}
                        style={{ overflowY: "auto" }}
                      ></textarea>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </div>
        </div>
      </div>
      {/* <QuestionCrafterWizard /> */}
    </div>
  );
};

export default withAuth(QuestionCrafter);
