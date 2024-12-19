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

  const sectionIndex = outline.findIndex(
    (s) => s.section_id === locationSection?.section_id
  );
  const [section, setCurrentSection] = useState(() => {
    return sectionIndex !== -1 ? outline[sectionIndex] : locationSection;
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
                  sectionIndex={sectionIndex}
                  bid_id={bid_id}
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
