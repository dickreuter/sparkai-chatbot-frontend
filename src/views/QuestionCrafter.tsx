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
import WordCountSelector from "../components/WordCountSelector.tsx";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import StatusMenu from "../components/StatusMenu.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import SectionTitle from "../components/SectionTitle.tsx";
import { fetchOutline } from "../utilityfunctions/updateSection.tsx";

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

  //console.log("selectedfolders:", sharedState.selectedFolders);
  const [subheadings, setSubheadings] = useState(section.subheadings || []);
  const [contentLoaded, setContentLoaded] = useState(true); // Set to true initially
  const [sectionAnswer, setSectionAnswer] = useState(null); // the answer generated for the subheadings
  const currentUserPermission = contributors[auth.email] || "viewer"; // Default to 'viewer' if not found
  const canUserEdit =
    currentUserPermission === "admin" || currentUserPermission === "editor";

  /////////////////////////////////////////////////////////////////////////////////////////////

  const [choice, setChoice] = useState("3");
  const [broadness, setBroadness] = useState("4");

  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [apiChoices, setApiChoices] = useState([]);
  const [wordAmounts, setWordAmounts] = useState({});
  const [sectionStatus, setSectionStatus] = useState(section.status);
  const [isLoadingSubheadings, setIsLoadingSubheadings] = useState(false);

  const navigate = useNavigate();

  //timer for adding new subesections
  useEffect(() => {
    let timer;
    if (isLoading && startTime) {
      timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(elapsed);
      }, 100); // Update every 100ms
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isLoading, startTime]);

  // Set initial section index from the passed section
  useEffect(() => {
    const index = outline.findIndex((s) => s.section_id === section.section_id);
    setCurrentSectionIndex(index !== -1 ? index : 0);
  }, [section.section_id, outline]);

  // Add this useEffect to update local subheadings when outline changes
  useEffect(() => {
    const currentSection = outline.find(
      (s) => s.section_id === section.section_id
    );
    if (currentSection) {
      setSubheadings(currentSection.subheadings || []);
    }
  }, [outline, section.section_id]);

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
      // - Load the subheadings for the target section
      setSubheadings(targetSection.subheadings || []);

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

  // Add this utility function to convert EditorState to plain text
  const getPlainTextFromEditorState = (editorState) => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    return rawContent.blocks.map((block) => block.text).join("\n");
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

  const deleteSubheading = async (subheading_id: string) => {
    try {
      console.log("Starting deletion for subheading:", subheading_id);
      console.log("Current outline before deletion:", outline);

      // First, find the current section in the outline
      const currentSectionIndex = outline.findIndex(
        (s) => s.section_id === section.section_id
      );

      if (currentSectionIndex === -1) {
        throw new Error("Section not found in outline");
      }

      console.log(
        "Current section subheadings:",
        outline[currentSectionIndex].subheadings
      );

      // Create a new outline with the updated subheadings
      const updatedOutline = outline.map((s) =>
        s.section_id === section.section_id
          ? {
              ...s,
              subheadings: s.subheadings.filter(
                (sh) => sh.subheading_id !== subheading_id
              )
            }
          : s
      );

      console.log(
        "Updated section subheadings:",
        updatedOutline[currentSectionIndex].subheadings
      );

      // Update local subheadings state for immediate UI feedback
      setSubheadings((prev) => {
        const updated = prev.filter((sh) => sh.subheading_id !== subheading_id);
        console.log("Updated local subheadings:", updated);
        return updated;
      });

      // Get the updated section from the new outline
      const updatedSection = updatedOutline[currentSectionIndex];

      // Update the current section with the new data
      setCurrentSection(updatedSection);

      // Force a refresh of the outline in shared state to ensure it propagates
      setSharedState((prev) => ({
        ...prev,
        outline: updatedOutline
      }));
      // Update status to reflect changes
      updateStatus("In Progress");

      // Log final state
      console.log(
        "Final outline after deletion:",
        updatedOutline[currentSectionIndex].subheadings
      );
    } catch (error) {
      console.error("Error deleting subheading:", error);
      displayAlert("Failed to delete subheading", "danger");
      // Rollback local state if there's an error
      setSubheadings(section.subheadings);
    }
  };

  // Add this function to handle the API call
  const updateSubheading = async (
    subheading_id: string,
    extra_instructions: string,
    word_count: number
  ) => {
    try {
      // Update shared state
      const updatedOutline = outline.map((s) => {
        if (s.section_id === section.section_id) {
          return {
            ...s,
            subheadings: s.subheadings.map((sh) =>
              sh.subheading_id === subheading_id
                ? { ...sh, extra_instructions, word_count }
                : sh
            )
          };
        }
        return s;
      });

      setSharedState((prev) => ({
        ...prev,
        outline: updatedOutline
      }));

      updateStatus("In Progress");
    } catch (error) {
      console.error("Error updating subheading:", error);
    }
  };

  const handleWordCountChange = (subheadingId: string, newCount: number) => {
    // Find the current extra instructions for this subheading
    const section = section.subheadings.find(
      (section) => section.subheading_id === subheadingId
    );

    if (section) {
      const extraInstructions = getPlainTextFromEditorState(
        section.editorState
      );

      updateSubheading(subheadingId, extraInstructions, newCount);
    }
  };

  // Update the handleAnswerChange function
  const handleAnswerChange = (
    editorState: EditorState,
    subheadingId: string,
    word_count: number
  ) => {
    console.log(
      `Updating editor state for section ${subheadingId}`,
      editorState
    );
    // Get the plain text content from the editor state
    const extraInstructions = getPlainTextFromEditorState(editorState);

    // Call the debounced update function
    updateSubheading(subheadingId, extraInstructions, wordCount);
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

  const handleChoiceSelection = (selectedChoice) => {
    if (selectedChoices.includes(selectedChoice)) {
      setSelectedChoices(
        selectedChoices.filter((choice) => choice !== selectedChoice)
      );
      setWordAmounts((prevWordAmounts) => {
        const newWordAmounts = { ...prevWordAmounts };
        delete newWordAmounts[selectedChoice];
        return newWordAmounts;
      });
    } else {
      setSelectedChoices([...selectedChoices, selectedChoice]);
      setWordAmounts((prevWordAmounts) => ({
        ...prevWordAmounts,
        [selectedChoice]: 100 // Default word amount
      }));
    }
    updateStatus("In Progress");
  };

  const renderChoices = () => {
    return (
      <div className="choices-container">
        {apiChoices
          .filter((choice) => choice && choice.trim() !== "") // Filter out empty or whitespace-only choices
          .map((choice, index) => (
            <div key={index} className="choice-item d-flex align-items-center">
              <Form.Check
                type="checkbox"
                checked={selectedChoices.includes(choice)}
                onChange={() => handleChoiceSelection(choice)}
              />
              {selectedChoices.includes(choice) ? (
                <Form.Control
                  type="text"
                  value={choice}
                  onChange={(e) => handleChoiceEdit(index, e.target.value)}
                  className="ml-2 editable-choice"
                  style={{ width: "70%", marginLeft: "10px" }}
                />
              ) : (
                <span
                  onClick={() => handleChoiceSelection(choice)}
                  style={{ cursor: "pointer" }}
                >
                  {choice}
                </span>
              )}
            </div>
          ))}
      </div>
    );
  };

  const handleChoiceEdit = (index, newValue) => {
    const updatedChoices = [...apiChoices];
    updatedChoices[index] = newValue;
    setApiChoices(updatedChoices);

    // Update selectedChoices and wordAmounts if the edited choice was selected
    if (selectedChoices.includes(apiChoices[index])) {
      const updatedSelectedChoices = selectedChoices.map((choice) =>
        choice === apiChoices[index] ? newValue : choice
      );
      setSelectedChoices(updatedSelectedChoices);

      const updatedWordAmounts = { ...wordAmounts };
      if (updatedWordAmounts[apiChoices[index]]) {
        updatedWordAmounts[newValue] = updatedWordAmounts[apiChoices[index]];
        delete updatedWordAmounts[apiChoices[index]];
      }
      setWordAmounts(updatedWordAmounts);
    }
  };

  const submitSelections = async () => {
    setIsLoading(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    try {
      console.log("Starting submitSelections with choices:", selectedChoices);
      console.log(sharedState.object_id);
      console.log(section.section_id);

      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/add_section_subheadings`,
        {
          selected_choices: selectedChoices,
          bid_id: sharedState.object_id,
          section_id: section.section_id // Add section_id to the request
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );

      console.log("Received response from question_multistep:", result.data);

      setApiChoices([]);
      setSelectedChoices([]);
      setWordAmounts({});
      fetchOutline(bid_id, tokenRef, setSharedState);
    } catch (error) {
      console.error("Error submitting selections:", error);
      displayAlert("Error generating responses", "danger");
    } finally {
      setIsLoading(false);
      setStartTime(null);
    }
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // Add this handler to your component
  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const reorderedSubheadings = reorder(
      subheadings,
      result.source.index,
      result.destination.index
    );

    // Update local state immediately
    setSubheadings(reorderedSubheadings);

    // Update the outline with the reordered subheadings
    const updatedOutline = outline.map((s) =>
      s.section_id === section.section_id
        ? { ...s, subheadings: reorderedSubheadings }
        : s
    );

    // Update shared state
    setSharedState((prev) => ({
      ...prev,
      outline: updatedOutline
    }));

    updateStatus("In Progress");
  };

  const renderSubheadings = () => {
    if (isLoadingSubheadings) {
      return <div></div>;
    }

    return (
      <div style={{ marginLeft: "40px" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="droppable-container"
                style={{
                  minHeight: "100px"
                }}
              >
                {subheadings.map((subheading, index) => (
                  <Draggable
                    key={subheading.subheading_id}
                    draggableId={subheading.subheading_id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`draggable-section ${snapshot.isDragging ? "dragging" : ""}`}
                        style={{
                          ...provided.draggableProps.style,
                          transform: provided.draggableProps.style?.transform,
                          transformOrigin: "0 0",
                          width: "100%"
                        }}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="drag-handle"
                          style={{
                            touchAction: "none",
                            userSelect: "none"
                          }}
                        >
                          <DragIndicatorIcon
                            style={{
                              fontSize: "35px",
                              color: "#6c757d",
                              display: "block",
                              pointerEvents: "none",
                              touchAction: "none"
                            }}
                          />
                        </div>

                        <Card className="section-card mb-4">
                          <div className="section-header">
                            <button
                              onClick={() =>
                                deleteSubheading(subheading.subheading_id)
                              }
                              className="p-2 delete-cross"
                            >
                              <FontAwesomeIcon
                                icon={faTimes}
                                className="w-5 h-5"
                              />
                            </button>
                            <h3
                              className="section-title"
                              title={subheading.title}
                            >
                              {subheading.title}
                            </h3>
                            <div>
                              <WordCountSelector
                                subheadingId={subheading.subheading_id}
                                initialCount={subheading.word_count || 100}
                                onChange={handleWordCountChange}
                                disabled={!canUserEdit}
                              />
                            </div>
                            <div></div>
                          </div>

                          <div className="editor-container">
                            <Editor
                              editorState={EditorState.createWithContent(
                                ContentState.createFromText(
                                  subheading.extra_instructions || ""
                                )
                              )}
                              onChange={(newState) =>
                                handleAnswerChange(
                                  newState,
                                  subheading.subheading_id,
                                  subheading.word_count
                                )
                              }
                              customStyleMap={{
                                BOLD: { fontWeight: "bold" }
                              }}
                              readOnly={!canUserEdit}
                              placeholder="Add extra information here about what you want to write about..."
                            />
                          </div>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
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
              <Button
                className="upload-button mt-2"
                onClick={sendQuestionToChatbot}
                disabled={inputText.trim() === ""}
              >
                Add Subsections
              </Button>

              <Row>
                <div className="" style={{ textAlign: "left" }}>
                  {isLoading && (
                    <div className="my-3">
                      <Spinner animation="border" />
                      <div>Elapsed Time: {elapsedTime.toFixed(1)}s</div>
                    </div>
                  )}
                  {choice === "3" && apiChoices.length > 0 && (
                    <div>
                      {renderChoices()}
                      <Button
                        variant="primary"
                        onClick={submitSelections}
                        className="upload-button mt-3"
                        disabled={selectedChoices.length === 0}
                      >
                        Generate answers for selected subsections
                      </Button>
                    </div>
                  )}
                </div>
              </Row>
            </Col>

            {isLoadingSubheadings ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Spinner></Spinner>
              </div>
            ) : (
              <>
                {section.subheadings.length > 0 ? (
                  <div className="proposal-header mb-2">
                    <h2 className="heavy mt-4 text-center">Subsections</h2>
                  </div>
                ) : (
                  <div></div>
                )}
              </>
            )}
            {renderSubheadings()}
            <p>{sectionAnswer}</p>
          </div>
        </div>
      </div>
      {/* <QuestionCrafterWizard /> */}
    </div>
  );
};

export default withAuth(QuestionCrafter);
