import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./BidExtractor.css";
import {
  BidContext,
  Section,
  Subheading
} from "./BidWritingStateManagerView.tsx";
import { displayAlert } from "../helper/Alert.tsx";
import "./ProposalPlan.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChevronDown,
  faChevronRight,
  faSquare,
  faTrash,
  faWandMagicSparkles
} from "@fortawesome/free-solid-svg-icons";
import StatusMenu from "../components/StatusMenu.tsx";
import OutlineInstructionsModal from "../modals/OutlineInstructionsModal.tsx";
import SectionMenu from "../components/SectionMenu.tsx";
import { MenuItem, Select, SelectChangeEvent, Skeleton } from "@mui/material";
import posthog from "posthog-js";
import { Button, Form, Row, Spinner } from "react-bootstrap";

const EditableCell = ({
  value: initialValue,
  onChange,
  type = "text"
}: {
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: string;
}) => {
  const [value, setValue] = useState(initialValue || "");

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      className="editable-cell"
      placeholder="-"
    />
  );
};

const selectStyle = {
  fontFamily: '"ClashDisplay", sans-serif',
  fontSize: "0.875rem",
  minWidth: "220px",
  "& MuiOutlinedInputNotchedOutline": {
    borderColor: "#ced4da"
  },
  "&:hover MuiOutlinedInputNotchedOutline": {
    borderColor: "#86b7fe"
  },
  "&.MuiFocused MuiOutlinedInputNotchedOutline": {
    borderColor: "#86b7fe",
    borderWidth: "1px"
  }
};

const menuStyle = {
  fontSize: "12px",
  fontFamily: '"ClashDisplay", sans-serif'
};

const ReviewerDropdown = ({
  value,
  onChange,
  contributors
}: {
  value: string;
  onChange: (value: string) => void;
  contributors: Record<string, string>;
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <Select
      value={value || ""}
      onChange={handleChange}
      size="small"
      style={selectStyle}
      displayEmpty
      MenuProps={{
        PaperProps: {
          style: menuStyle
        }
      }}
    >
      <MenuItem value="" style={menuStyle}>
        <em>Select Reviewer</em>
      </MenuItem>
      {Object.entries(contributors).length > 0 ? (
        Object.entries(contributors).map(([email, role], index) => (
          <MenuItem key={index} value={email} style={menuStyle}>
            {email} ({role})
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled value="" style={menuStyle}>
          No Contributors Available
        </MenuItem>
      )}
    </Select>
  );
};

const QuestionTypeDropdown = ({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <Select
      value={value || "3b"}
      onChange={handleChange}
      size="small"
      style={selectStyle}
      displayEmpty
      MenuProps={{
        PaperProps: {
          style: menuStyle
        }
      }}
    >
      <MenuItem value="3b" style={menuStyle}>
        <em>General</em>
      </MenuItem>
      <MenuItem value="3b_case_study" style={menuStyle}>
        <em>Case Study</em>
      </MenuItem>
      <MenuItem value="3b_commercial" style={menuStyle}>
        <em>Compliance</em>
      </MenuItem>
      <MenuItem value="3b_personnel" style={menuStyle}>
        <em>Team</em>
      </MenuItem>
      <MenuItem value="3b_technical" style={menuStyle}>
        <em>Technical</em>
      </MenuItem>
    </Select>
  );
};

const DebouncedTextArea = ({ value, onChange, placeholder }) => {
  const [localValue, setLocalValue] = useState(value || "");
  const debouncedCallback = useRef(null);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear previous timeout
    if (debouncedCallback.current) {
      clearTimeout(debouncedCallback.current);
    }

    // Set new timeout for the parent update
    debouncedCallback.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  return (
    <textarea
      className="writingplan-text-area"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
};
const ProposalPlan = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const navigate = useNavigate();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState, setSharedState } = useContext(BidContext);
  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [apiChoices, setApiChoices] = useState([]);
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [wordAmounts, setWordAmounts] = useState({});
  const [choice, setChoice] = useState("3");
  const [broadness, setBroadness] = useState("4");
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(
    null
  );

  const { object_id, contributors, outline } = sharedState;

  const currentUserPermission = contributors[auth.email] || "viewer";
  const [showModal, setShowModal] = useState(false);

  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );

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

  const handleRowClick = (e: React.MouseEvent, index: number) => {
    // Prevent row click if clicking on interactive elements
    const isInteractiveElement = (e.target as HTMLElement).closest(
      'input, select, button, a, .MuiSelect-select, [role="button"], .editable-cell'
    );

    if (!isInteractiveElement) {
      e.preventDefault();
      toggleSection(index);
    }
  };

  // Add this function to handle toggling sections
  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleContextMenu = (e, index) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedRowIndex(index);
  };

  const handleClickOutside = (e) => {
    if (contextMenu && !e.target.closest(".context-menu")) {
      setContextMenu(null);
      setSelectedRowIndex(null);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const handleAddSection = async () => {
    if (!object_id || selectedRowIndex === null) return;

    const newSection = {
      heading: "New Section",
      word_count: 0,
      reviewer: "",
      status: "Not Started" as const,
      subsections: 0,
      question: "",
      answer: "",
      weighting: "",
      page_limit: "",
      subheadings: [],
      choice: "3b",
      writingplan: ""
    };

    try {
      const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );

      const updatedOutline = [...sharedState.outline];
      updatedOutline.splice(selectedRowIndex, 0, {
        ...newSection,
        section_id: uuid
      });

      setSharedState((prevState) => ({
        ...prevState,
        outline: updatedOutline
      }));
    } catch (err) {
      console.error("Error adding section:", err);
      displayAlert("Failed to add section", "danger");
    }
    setContextMenu(null);
  };

  const handleDeleteSection = async (
    sectionId: string,
    sectionIndex: number
  ) => {
    try {
      posthog.capture("proposal_section_delete_started", {
        bidId: object_id,
        sectionId,
        sectionIndex
      });

      await deleteSection(sectionId, sectionIndex);
    } catch (err) {
      console.log(err);
      posthog.capture("proposal_section_delete_failed", {
        bidId: object_id,
        sectionId,
        error: err.message
      });
    }
  };

  const handleEditClick = (section: Section) => {
    posthog.capture("proposal_section_edit", {
      bidId: object_id,
      sectionId: section.section_id,
      sectionHeading: section.heading
    });
    navigate("/question-crafter", {
      state: {
        section,
        bid_id: object_id,
        state_outline: outline
      }
    });
  };

  const showViewOnlyMessage = () => {
    displayAlert("You only have permission to view this bid.", "danger");
  };

  useEffect(() => {
    if (outline.length === 0) {
      setShowModal(true);
    }
  }, [outline.length]);

  const handleRegenerateClick = () => {
    setShowModal(true);
  };

  const deleteSection = async (sectionId: string, sectionIndex: number) => {
    try {
      const updatedOutline = [...sharedState.outline];
      updatedOutline.splice(sectionIndex, 1);

      setSharedState((prevState) => ({
        ...prevState,
        outline: updatedOutline
      }));

      displayAlert("Section deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting section:", err);
      displayAlert("Failed to delete section", "danger");
    }
  };

  const handleDeleteClick = (section: Section, index: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this section? This action cannot be undone."
      )
    ) {
      deleteSection(section.section_id, index);
    }
  };

  const handleDeleteSubheading = (sectionIndex, subheadingIndex) => {
    const newOutline = [...outline];
    newOutline[sectionIndex].subheadings = newOutline[
      sectionIndex
    ].subheadings.filter((_, idx) => idx !== subheadingIndex);

    setSharedState((prevState) => ({
      ...prevState,
      outline: newOutline
    }));
  };

  const handleSectionChange = (
    index: number,
    field: keyof Section,
    value: any
  ) => {
    // Create new outline immediately for local state
    const newOutline = [...sharedState.outline];
    newOutline[index] = {
      ...newOutline[index],
      [field]: value
    };

    // Debounce the setState call

    setSharedState((prevState) => ({
      ...prevState,
      outline: newOutline
    }));

    if (field === "status") {
      posthog.capture("proposal_section_status_changed", {
        bidId: object_id,
        sectionIndex: index,
        newStatus: value
      });
    }
  };

  const fetchOutline = async () => {
    if (!object_id) return;
    const formData = new FormData();
    formData.append("bid_id", object_id);
    setIsLoading(true);
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_bid_outline`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const outlineWithStatus = response.data.map((section: any) => ({
        ...section,
        status:
          section.status ||
          (section.completed
            ? "Completed"
            : section.in_progress
              ? "In Progress"
              : "Not Started")
      }));

      setSharedState((prevState) => ({
        ...prevState,
        outline: outlineWithStatus
      }));
    } catch (err) {
      console.error("Error fetching outline:", err);
      displayAlert("Failed to fetch outline", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuestionToChatbot = async (
    inputText: string,
    backgroundInfo: string,
    sectionIndex: number
  ) => {
    setCurrentSectionIndex(sectionIndex); // Add this line
    setQuestionAsked(true);
    localStorage.setItem("questionAsked", "true");
    setIsLoading(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setApiChoices([]);
    console.log("question");
    console.log(choice);
    console.log(broadness);
    console.log(inputText);
    console.log(backgroundInfo);
    console.log(sharedState.selectedFolders);
    console.log(sharedState.object_id);

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
  };

  const renderChoices = () => {
    return (
      <div className="choices-container ms-2">
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

      // Generate UUID for each subheading
      const generateUUID = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      // Convert selected choices into subheadings format with all required properties
      const newSubheadings: Subheading[] = selectedChoices.map((choice) => ({
        title: choice,
        word_count: parseInt(wordAmounts[choice] || "100"),
        content: "",
        subheading_id: generateUUID(),
        extra_instructions: "" // Add default value for extra_instructions
      }));

      // Get the current section and update its subheadings
      setSharedState((prevState) => {
        const newOutline = [...prevState.outline];

        if (currentSectionIndex !== null && currentSectionIndex >= 0) {
          // If section already has subheadings, append new ones
          const existingSubheadings =
            newOutline[currentSectionIndex].subheadings || [];
          newOutline[currentSectionIndex] = {
            ...newOutline[currentSectionIndex],
            subheadings: [...existingSubheadings, ...newSubheadings],
            subsections: existingSubheadings.length + newSubheadings.length
          };
        }

        return {
          ...prevState,
          outline: newOutline
        };
      });

      // Reset selection state
      setApiChoices([]);
      setSelectedChoices([]);
      setWordAmounts({});
    } catch (error) {
      console.error("Error submitting selections:", error);
      displayAlert("Error generating responses", "danger");
    } finally {
      setIsLoading(false);
      setStartTime(null);
    }
  };

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar
            showViewOnlyMessage={showViewOnlyMessage}
            initialBidName={"initialBidName"}
            outline={outline}
            object_id={object_id}
            handleRegenerateClick={handleRegenerateClick}
          />
          <OutlineInstructionsModal
            show={showModal}
            onHide={() => setShowModal(false)}
            bid_id={object_id}
            fetchOutline={fetchOutline}
          />

          {outline.length === 0 ? (
            <div></div>
          ) : (
            <div>
              <div className="table-responsive mt-3">
                <table
                  className="outline-table"
                  style={{ tableLayout: "fixed" }}
                >
                  <thead style={{ width: "100%" }}>
                    <tr>
                      <th className="" style={{ width: "45%" }}>
                        Section
                      </th>
                      <th className="" style={{ width: "14%" }}>
                        Reviewer
                      </th>
                      <th className="" style={{ width: "14%" }}>
                        Question Type
                      </th>
                      <th className=" text-center" style={{ width: "8%" }}>
                        Completed
                      </th>
                      <th className=" text-center" style={{ width: "8%" }}>
                        Subsections
                      </th>
                      <th className=" text-center" style={{ width: "6.5%" }}>
                        Words
                      </th>

                      <th className=" text-center" style={{ width: "6%" }}>
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outline.map((section, index) => {
                      const isExpanded = expandedSections.has(index);
                      return (
                        <React.Fragment key={index}>
                          <tr
                            onContextMenu={(e) => handleContextMenu(e, index)}
                            onClick={(e) => handleRowClick(e, index)}
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleSection(index)} // Use toggleSection here
                                  className="bg-transparent border-0 cursor-pointer text-black me-2"
                                >
                                  <FontAwesomeIcon
                                    icon={
                                      isExpanded
                                        ? faChevronDown
                                        : faChevronRight
                                    }
                                    size="sm"
                                  />
                                </button>
                                <span>{section.heading}</span>
                              </div>
                            </td>
                            <td className="">
                              <ReviewerDropdown
                                value={section.reviewer}
                                onChange={(value) =>
                                  handleSectionChange(index, "reviewer", value)
                                }
                                contributors={contributors}
                              />
                            </td>
                            <td className="">
                              <QuestionTypeDropdown
                                value={section.choice}
                                onChange={(value) =>
                                  handleSectionChange(index, "choice", value)
                                }
                              />
                            </td>
                            <td className="text-center">
                              <StatusMenu
                                value={section.status}
                                onChange={(value) => {
                                  handleSectionChange(index, "status", value);
                                }}
                              />
                            </td>
                            <td className="text-center">
                              {section.subsections}
                            </td>
                            <td className="text-center">
                              {section.word_count}
                            </td>

                            <td className="text-center">
                              <div className="d-flex justify-content-center">
                                <button
                                  onClick={() =>
                                    handleDeleteClick(section, index)
                                  }
                                  className="bg-transparent border-0 cursor-pointer text-black"
                                  title="Delete section"
                                >
                                  <FontAwesomeIcon icon={faTrash} size="sm" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <>
                              <tr className="writingplan-box">
                                <td colSpan={7} className="py-3 px-4">
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "16px",
                                      width: "100%"
                                    }}
                                  >
                                    <div
                                      style={{
                                        flex: "1",
                                        width: "50%",
                                        maxWidth: "50%"
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: "500",
                                          marginBottom: "8px"
                                        }}
                                      >
                                        Question
                                      </div>
                                      <DebouncedTextArea
                                        value={section.question}
                                        onChange={(value) =>
                                          handleSectionChange(
                                            index,
                                            "question",
                                            value
                                          )
                                        }
                                        placeholder={
                                          "What is your management policy?"
                                        }
                                      />
                                    </div>
                                    <div
                                      style={{
                                        flex: "1",
                                        width: "50%",
                                        maxWidth: "50%"
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: "500",
                                          marginBottom: "8px"
                                        }}
                                      >
                                        Writing Plan
                                      </div>

                                      <DebouncedTextArea
                                        value={section.writingplan}
                                        onChange={(value) =>
                                          handleSectionChange(
                                            index,
                                            "writingplan",
                                            value
                                          )
                                        }
                                        placeholder={
                                          "Please write in a formative tone where you mention our strategy of how we will manage this project"
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-2">
                                    {/* <button
                                        onClick={() => handleEditClick(section)}
                                        className="upload-button"
                                      >
                                        Preview Response
                                      </button> */}

                                    <button
                                      className="orange-button ms-2 flex items-center gap-2"
                                      onClick={() =>
                                        sendQuestionToChatbot(
                                          section.question,
                                          section.writingplan || "",
                                          index
                                        )
                                      }
                                      disabled={section.question.trim() === ""}
                                    >
                                      {isLoading ? (
                                        <>
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            className="me-2"
                                          />
                                          <span>Generating...</span>
                                        </>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon
                                            icon={faWandMagicSparkles}
                                            className="me-2"
                                          />
                                          <span>Generate Subheadings</span>
                                        </>
                                      )}
                                    </button>

                                    <Row>
                                      <div
                                        className=""
                                        style={{ textAlign: "left" }}
                                      >
                                        {choice === "3" &&
                                          apiChoices.length > 0 && (
                                            <div>
                                              {renderChoices()}
                                              <Button
                                                variant="primary"
                                                onClick={submitSelections}
                                                className="upload-button mt-3"
                                                disabled={
                                                  selectedChoices.length === 0
                                                }
                                              >
                                                Add Choices
                                              </Button>
                                            </div>
                                          )}
                                      </div>
                                    </Row>
                                  </div>
                                </td>
                              </tr>
                              {section.subheadings?.map(
                                (subheading, subIndex) => (
                                  <tr
                                    key={`${index}-${subIndex}`}
                                    className="bg-gray-50 hover:bg-gray-100"
                                  >
                                    <td className="">
                                      <div className="ms-3 flex items-center">
                                        <FontAwesomeIcon
                                          icon={faArrowRight}
                                          size="sm"
                                          className="text-black me-2"
                                        />
                                        <EditableCell
                                          value={subheading.title}
                                          onChange={(value) => {
                                            const newSubheadings = [
                                              ...section.subheadings
                                            ];
                                            newSubheadings[subIndex] = {
                                              ...newSubheadings[subIndex],
                                              title: value
                                            };
                                            handleSectionChange(
                                              index,
                                              "subheadings",
                                              newSubheadings
                                            );
                                          }}
                                        />
                                      </div>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td className="text-center">
                                      <input
                                        type="number"
                                        value={subheading.word_count || 0}
                                        min="0"
                                        className="form-control d-inline-block word-count-input"
                                        style={{
                                          width: "60px",
                                          textAlign: "center"
                                        }}
                                        onChange={(e) => {
                                          // First, create a new array of subheadings with the updated word count
                                          const newSubheadings =
                                            section.subheadings.map(
                                              (sub, i) => {
                                                if (i === subIndex) {
                                                  return {
                                                    ...sub,
                                                    word_count:
                                                      parseInt(
                                                        e.target.value
                                                      ) || 0
                                                  };
                                                }
                                                return sub;
                                              }
                                            );

                                          // Update the subheadings first
                                          handleSectionChange(
                                            index,
                                            "subheadings",
                                            newSubheadings
                                          );
                                        }}
                                      />
                                    </td>
                                    <td className="text-center">
                                      <div className="d-flex justify-content-center">
                                        <button
                                          onClick={() =>
                                            handleDeleteSubheading(
                                              index,
                                              subIndex
                                            )
                                          }
                                          className="bg-transparent border-0 cursor-pointer text-black"
                                          title="Delete subheading"
                                        >
                                          <FontAwesomeIcon
                                            icon={faTrash}
                                            size="sm"
                                          />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              )}
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {contextMenu && (
                <SectionMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  onClose={() => setContextMenu(null)}
                  onAddSection={handleAddSection}
                  onDeleteSection={handleDeleteSection}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(ProposalPlan);
