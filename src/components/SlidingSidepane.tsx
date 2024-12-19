import React from "react";
import { Card, Col, Row, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faTrash,
  faWandMagicSparkles,
  faChevronLeft,
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import DebouncedTextArea from "./DeboucedTextArea";
import "./SlidingSidepane.css";
import { Contributor, Section } from "../views/BidWritingStateManagerView";
import StatusMenu from "./StatusMenu";
import ReviewerDropdown from "./dropdowns/ReviewerDropdown";
import QuestionTypeDropdown from "./dropdowns/QuestionTypeDropdown";

interface ProposalSidepaneProps {
  section: Section;
  contributors: Contributor;
  index: number;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  isPreviewLoading: boolean;
  handleEditClick: (section: Section, index: number) => void;
  handleSectionChange: (
    index: number,
    field: keyof Section,
    value: any
  ) => void;
  sendQuestionToChatbot: (
    question: string,
    writingPlan: string,
    index: number,
    choice: string
  ) => void;
  apiChoices: string[];
  renderChoices: () => React.ReactNode;
  selectedChoices: string[];
  submitSelections: () => void;
  handleDeleteSubheading: (
    sectionIndex: number,
    subheadingIndex: number
  ) => void;
  totalSections: number; // Add this
  onNavigate: (direction: "prev" | "next") => void; // Add this
}

const ProposalSidepane: React.FC<ProposalSidepaneProps> = ({
  section,
  contributors,
  index,
  isOpen,
  onClose,
  isLoading,
  isPreviewLoading,
  handleEditClick,
  handleSectionChange,
  sendQuestionToChatbot,
  apiChoices,
  renderChoices,
  selectedChoices,
  submitSelections,
  handleDeleteSubheading,
  totalSections,
  onNavigate
}) => {
  if (!section) return null;

  return (
    <>
      <div
        className={`sidepane-backdrop ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />
      <div className={`sidepane ${isOpen ? "open" : ""}`}>
        <div className="sidepane-header">
          <h3>{section.heading}</h3>

          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="sidepane-content">
          <div className="proposal-header mb-3">
            <div className="navigation-container">
              <div>
                <button
                  className="nav-button pr-2"
                  onClick={() => onNavigate("prev")}
                  disabled={index === 0}
                  title="Previous section"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <span className="section-counter">
                  Question {index + 1} of {totalSections}
                </span>
                <button
                  className="nav-button pl-2"
                  onClick={() => onNavigate("next")}
                  disabled={index === totalSections - 1}
                  title="Next section"
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
            <StatusMenu
              value={section.status}
              onChange={(value) => {
                handleSectionChange(index, "status", value);
              }}
            />
          </div>

          <div className="proposal-header mb-3">
            <div>
              <ReviewerDropdown
                value={section.reviewer}
                onChange={(value) =>
                  handleSectionChange(index, "reviewer", value)
                }
                contributors={contributors}
                className="me-2"
              />
              <QuestionTypeDropdown
                value={section.choice}
                onChange={(value) =>
                  handleSectionChange(index, "choice", value)
                }
              />
            </div>
            <input
              type="number"
              value={section.word_count || 0}
              min="0"
              step="50"
              className="form-control d-inline-block word-count-input"
              style={{
                width: "100px",
                textAlign: "center"
              }}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0) {
                  handleSectionChange(index, "word_count", value);
                }
              }}
            />
          </div>

          <div className="sidepane-section">
            <div className="proposal-header mb-2">
              <div>Question</div>
            </div>
            <DebouncedTextArea
              value={section.question}
              onChange={(value) =>
                handleSectionChange(index, "question", value)
              }
              placeholder="What is your management policy?"
              className="writingplan-text-area"
            />

            <div>
              <button
                className="orange-button flex items-center mt-2"
                onClick={() =>
                  sendQuestionToChatbot(
                    section.question,
                    section.writingplan || "",
                    index,
                    "3a"
                  )
                }
                disabled={section.question.trim() === "" || isPreviewLoading}
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
            </div>

            {apiChoices.length > 0 && (
              <div className="sidepane-section">
                {renderChoices()}
                <button
                  className="upload-button mt-3"
                  onClick={submitSelections}
                  disabled={selectedChoices.length === 0}
                >
                  Add Choices
                </button>
              </div>
            )}
          </div>

          {section.subheadings && section.subheadings.length > 0 && (
            <div className="sidepane-section">
              <div className="">
                <div style={{ fontWeight: "500", marginBottom: "8px" }}>
                  Talking Points
                </div>
              </div>
              <div className="subheadings-list">
                {section.subheadings.map((subheading, subIndex) => (
                  <div key={subIndex} className="subheading-item">
                    <div className="subheading-content">
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        size="sm"
                        className="text-black me-2"
                      />
                      <input
                        type="text"
                        value={subheading.title}
                        onChange={(e) => {
                          const newSubheadings = [...section.subheadings];
                          newSubheadings[subIndex] = {
                            ...newSubheadings[subIndex],
                            title: e.target.value
                          };
                          handleSectionChange(
                            index,
                            "subheadings",
                            newSubheadings
                          );
                        }}
                        className="subheading-input"
                      />
                      <button
                        className="delete-subheading-button"
                        onClick={() => handleDeleteSubheading(index, subIndex)}
                        title="Delete subheading"
                      >
                        <FontAwesomeIcon icon={faTrash} size="sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sidepane-section">
            <div className="proposal-header mb-2">Writing Plan</div>
            <DebouncedTextArea
              value={section.writingplan}
              onChange={(value) =>
                handleSectionChange(index, "writingplan", value)
              }
              placeholder="Please write in a formative tone where you mention our strategy of how we will manage this project"
              className="writingplan-text-area"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProposalSidepane;
