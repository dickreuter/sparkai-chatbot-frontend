import React, { useState, useEffect, useRef, useContext } from 'react';
import { Row, Col, Dropdown, Modal, Button, Form } from 'react-bootstrap';
import CustomEditor from "../components/TextEditor.tsx";
import withAuth from '../routes/withAuth.tsx';
import TemplateLoader from '../components/TemplateLoader.tsx';
import { useAuthUser } from 'react-auth-kit';
import handleGAEvent from '../utilities/handleGAEvent.tsx';
import { BidContext } from '../views/BidWritingStateManagerView.tsx';
import './Proposal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';

function ProposalEditor({ bidData: editorState, appendResponse, selectedQuestionId, setSelectedQuestionId }) {
  const { sharedState, setSharedState, saveProposal, addDocument, removeDocument, selectDocument } = useContext(BidContext);
  const [responses, setResponses] = useState([]);
  const proposalContainerRef = useRef(null);
  const [response, setResponse] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [renamingIndex, setRenamingIndex] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);

  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const handleDeleteDocument = (index, event) => {
    if (event) {
      event.stopPropagation();
    }
    setDeletingIndex(index);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (deletingIndex !== null) {
      removeDocument(deletingIndex);
    }
    setShowDeleteModal(false);
    setDeletingIndex(null);
  };

  useEffect(() => {
    if (sharedState.documents.length > 0) {
      const currentDocument = sharedState.documents[sharedState.currentDocumentIndex];
      if (currentDocument && currentDocument.editorState) {
        const contentState = currentDocument.editorState.getCurrentContent();
        const text = contentState.getPlainText('\n');
        const parsedResponses = parseResponses(text);
        setResponses(parsedResponses);
        if (selectedQuestionId && selectedQuestionId !== "navigate") {
          updateSelection(selectedQuestionId, parsedResponses);
        }
      }
    }
  }, [sharedState.documents, sharedState.currentDocumentIndex, selectedQuestionId]);

  useEffect(() => {
    const container = proposalContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight });
    }
  }, []);

  function updateSelection(questionId, parsedResponses) {
    const foundResponse = parsedResponses.find(res => res.id.toString() === questionId);
    if (foundResponse) {
      scrollToQuestion(foundResponse.question);
    }
  }

  function parseResponses(text) {
    const questionsAnswers = [];
    const questionRegex = /Question:\s*(.*?)\s*Answer:\s*(.*?)(?=\s*Question:|$)/gs;
    let match;
    while ((match = questionRegex.exec(text)) !== null) {
      if (match[1].trim() !== '') {
        questionsAnswers.push({
          question: match[1].trim(),
          answer: match[2].trim()
        });
      }
    }
    return questionsAnswers.map((item, index) => ({
      id: index,
      question: item.question,
      answer: item.answer
    }));
  }

  function scrollToQuestion(question) {
    const container = proposalContainerRef.current;
    if (container) {
      const regex = new RegExp(question, 'i');
      const index = container.textContent.search(regex);
      if (index >= 0) {
        const proportion = index / container.textContent.length;
        container.scrollTo({
          top: (proportion * container.scrollHeight) - 200,
          behavior: 'smooth'
        });
      }
    }
  }

  const handleSelect = (eventKey) => {
    if (eventKey !== "navigate") {
      setSelectedQuestionId(eventKey);
    }
  };
  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const handleAddDocument = () => {
    setNewDocName('');
    setRenamingIndex(null);
    setShowModal(true);
  };

  const handleRenameDocument = (index, event) => {
    if (event) {
      event.stopPropagation();
    }
    setNewDocName(sharedState.documents[index].name);
    setRenamingIndex(index);
    setShowModal(true);
  };

  const handleModalSave = () => {
    if (renamingIndex !== null) {
      const updatedDocuments = [...sharedState.documents];
      updatedDocuments[renamingIndex].name = newDocName;
      setSharedState(prevState => ({
        ...prevState,
        documents: updatedDocuments
      }));
    } else {
      addDocument(newDocName);
    }
    setShowModal(false);
  };

  return (
    <>
      <div className="proposal-header">
        <h1 className='heavy mb-3'>Bid Compiler</h1>
        <div className="dropdown-container">
          <Dropdown onSelect={handleSelect}>
            <Dropdown.Toggle className="upload-button custom-dropdown-toggle" id="dropdown-basic">
              Navigate to Question
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {responses.length > 0 ? (
                responses.map((response, index) => (
                  <Dropdown.Item key={index} eventKey={response.id.toString()}>
                    {truncateText(response.question, 50)}
                  </Dropdown.Item>
                ))
              ) : (
                <Dropdown.Item eventKey="navigate" disabled>
                  Add some Question/Answer blocks to navigate!
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
      <div className="tabs-container">
  {sharedState.documents.map((doc, index) => (
    <div
      key={index}
      className={`tab ${sharedState.currentDocumentIndex === index ? 'active' : ''}`}
      onClick={() => selectDocument(index)}
    >
      <span className="tab-content">
        <span className="doc-name">{doc.name}</span>
        <FontAwesomeIcon 
          icon={faPencilAlt} 
          className="rename-icon" 
          onClick={(e) => handleRenameDocument(index, e)}
        />
      </span>
      {sharedState.documents.length > 1 && (
        <span className="close-tab" onClick={(e) => handleDeleteDocument(index, e)}>
          &times;
        </span>
      )}
    </div>
  ))}
  <button className="addTab" onClick={handleAddDocument}>+</button>
</div>
      <div className="proposal-container" ref={proposalContainerRef}>
        <Row className="justify-content-md-center">
          <Col md={12}>
            {sharedState.documents.length > 0 && (
              <CustomEditor
                appendResponse={appendResponse}
                editorState={sharedState.documents[sharedState.currentDocumentIndex].editorState}
                setEditorState={(editorState) => {
                  const updatedDocuments = [...sharedState.documents];
                  updatedDocuments[sharedState.currentDocumentIndex].editorState = editorState;
                  setSharedState(prevState => ({
                    ...prevState,
                    documents: updatedDocuments
                  }));
                }}
              />
            )}
          </Col>
        </Row>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{renamingIndex !== null ? 'Rename Document' : 'New Document'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formDocName">
              <Form.Label>Document Name</Form.Label>
              <Form.Control
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button className="upload-button"onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button className="upload-button" style={{backgroundColor: "green"}} onClick={handleModalSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Confirm Deletion</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Are you sure you want to delete this document? This action cannot be undone.
  </Modal.Body>
  <Modal.Footer>
    <Button className="upload-button" onClick={() => setShowDeleteModal(false)}>
      Cancel
    </Button>
    <Button className="upload-button" style={{backgroundColor: "red"}} onClick={confirmDelete}>
      Delete
    </Button>
  </Modal.Footer>
</Modal>
    </>
  );
}

export default withAuth(ProposalEditor);
