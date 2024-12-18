import React from 'react';
import { Card, Col, Row, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faTrash, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { Section } from '../views/BidWritingStateManagerView';
import DebouncedTextArea from './DeboucedTextArea';
import { IconButton, Tooltip } from '@mui/material';
import InfoIcon from "@mui/icons-material/Info";

interface ProposalSidepaneProps {
  section: Section;
  index: number;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  isPreviewLoading: boolean;
  handleEditClick: (section: Section, index: number) => void;
  handleSectionChange: (index: number, field: keyof Section, value: any) => void;
  sendQuestionToChatbot: (question: string, writingPlan: string, index: number, choice: string) => void;
  apiChoices: string[];
  renderChoices: () => React.ReactNode;
  selectedChoices: string[];
  submitSelections: () => void;
  handleDeleteSubheading: (sectionIndex: number, subheadingIndex: number) => void;
}

const ProposalSidepane: React.FC<ProposalSidepaneProps> = ({
  section,
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
  handleDeleteSubheading
}) => {
  if (!section) return null;

  return (
    <>
    <div 
        className={`sidepane-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
    <div className={`sidepane ${isOpen ? 'open' : ''}`}>
      <div className="sidepane-header">
        <h3>{section.heading}</h3>
        <button 
          className="close-button"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="sidepane-content">
        <div className="sidepane-section">
          <div className="proposal-header mb-2">
            <div >
              Question
            </div>
            
          </div>
          <DebouncedTextArea
            value={section.question}
            onChange={(value) => handleSectionChange(index, "question", value)}
            placeholder="What is your management policy?"
            className='writingplan-text-area'
          />
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
                          handleSectionChange(index, "subheadings", newSubheadings);
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

        <div className="sidepane-actions">
          <button
            className="orange-button ms-2 flex items-center gap-2"
            onClick={() => sendQuestionToChatbot(
              section.question,
              section.writingplan || "",
              index,
              "3a"
            )}
            disabled={section.question.trim() === "" || isPreviewLoading}
          >
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faWandMagicSparkles} className="me-2" />
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

        <div className="sidepane-section">
          <div className="proposal-header mb-2">
            Writing Plan
            <button
              className="preview-button ms-2"
              onClick={() => handleEditClick(section, index)}
              disabled={isPreviewLoading}
            >
              {isPreviewLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  <span>Generating Preview</span>
                </>
              ) : (
                "Preview Response"
              )}
            </button>
          </div>
          <DebouncedTextArea
            value={section.writingplan}
            onChange={(value) => handleSectionChange(index, "writingplan", value)}
            placeholder="Please write in a formative tone where you mention our strategy of how we will manage this project"
            className='writingplan-text-area'
          />
        </div>

        <div className="sidepane-section">
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
          </div>


        
      </div>
    </div>
    </>
  );
};

export default ProposalSidepane;