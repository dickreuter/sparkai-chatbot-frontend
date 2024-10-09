import React, { useState, useEffect, useRef, useContext } from 'react';
import { Row, Col, Dropdown, Modal, Button, Form, Spinner } from 'react-bootstrap';
import CustomEditor from "../components/TextEditor.tsx";
import withAuth from '../routes/withAuth.tsx';
import TemplateLoader from '../components/TemplateLoader.tsx';
import { useAuthUser } from 'react-auth-kit';
import handleGAEvent from '../utilities/handleGAEvent.tsx';
import { BidContext } from '../views/BidWritingStateManagerView.tsx';
import './Proposal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from '../helper/Constants.tsx';
import { displayAlert } from '../helper/Alert.tsx';

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
  const [isLoading, setIsLoading] = useState(false);
  const [newDocType, setNewDocType] = useState<'qa sheet' | 'execSummary' | 'coverLetter'>('qa sheet');


  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { 
    contributors

  } = sharedState;


  const currentUserPermission = contributors[auth.email] || 'viewer'; 
  const canUserEdit = currentUserPermission === "admin" || currentUserPermission === "editor";

 
  
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

  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // ... other existing code

  const showNoDocsMessage = documents.length === 0 && (newDocType === 'execSummary' || newDocType === 'coverLetter');


  const fetchDocuments = async () => {
    try {
      if (sharedState.object_id) {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/get_tender_library_doc_filenames`,
          { bid_id: sharedState.object_id },  // Send as JSON body
          {
            headers: {
              'Authorization': `Bearer ${tokenRef.current}`,
              'Content-Type': 'application/json',  // Changed to JSON
            }
          }
        );
        console.log("tender library docs", response);
        setDocuments(response.data.filenames);
        
      }
     
    } catch (error) {
      console.error("Error fetching tender library filenames:", error);
      displayAlert('Error fetching documents', "danger");
    }
  };
  


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
  const handleModalSave = async () => {
    setIsLoading(true);
    try {
      if (renamingIndex !== null) {
        const updatedDocuments = [...sharedState.documents];
        updatedDocuments[renamingIndex].name = newDocName;
        setSharedState(prevState => ({
          ...prevState,
          documents: updatedDocuments
        }));
      } else {
        await addDocument(newDocName, newDocType);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error adding/renaming document:", error);
      displayAlert("Failed to add document. Please try again.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="proposal-header">
        <h1 className='heavy mb-3' id='proposal-editor'>Bid Compiler</h1>
      </div>
      <div className="tabs-container" >
  {sharedState.documents.map((doc, index) => (
    <div
      key={index}
      className={`tab ${sharedState.currentDocumentIndex === index ? 'active' : ''}`}
      onClick={() => selectDocument(index)}
    >
      <span className="tab-content">
        <span className="doc-name" id='tab-container'>{doc.name}</span>
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
  <button className="addTab" id='add-section-button' onClick={handleAddDocument} disabled={!canUserEdit}>+</button>
</div>
      <div className="proposal-container" ref={proposalContainerRef}>
        <Row className="justify-content-md-center">
          <Col md={12}>
            {sharedState.documents.length > 0 && (
             <CustomEditor
             appendResponse={appendResponse}
             disabled={!canUserEdit}
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

     <Modal show={showModal} onHide={() => !isLoading && setShowModal(false)}>
        <Modal.Header className='px-4' closeButton={!isLoading}>
          <Modal.Title>{renamingIndex !== null ? 'Rename Document' : 'New Document'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className='px-4'>
          <Form>
            <Form.Group controlId="formDocName" className='mb-2'>
              <Form.Label>Document Name</Form.Label>
              <Form.Control
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                disabled={isLoading}
              />
            </Form.Group>
            {renamingIndex === null && (
              <Form.Group controlId="formDocType" className='mb-2'>
                <Form.Label>Document Type</Form.Label>
                <Form.Control
                  as="select"
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as 'qa sheet' | 'execSummary' | 'coverLetter')}
                  disabled={isLoading}
                >
                  <option value="qa sheet">Question Answer</option>
                  <option value="execSummary">Executive Summary</option>
                  <option value="coverLetter">Cover Letter</option>
                </Form.Control>
              </Form.Group>
            )}
          </Form>
          {isLoading && (
            <p className="mt-3">
              Generating a template using the information from your Tender Library...
            </p>
          )}
          {showNoDocsMessage && (
            <p className="mt-3 text-danger">
              Please upload some relevant documents to the tender library to generate a cover letter or executive summary.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          
          <Button 
            className="upload-button" 
            style={{backgroundColor: "green"}} 
            onClick={handleModalSave}
            disabled={isLoading || showNoDocsMessage}
          >
            {isLoading ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : (
              'Add'
            )}
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
    <Button className="upload-button" style={{backgroundColor: "red"}} onClick={confirmDelete}>
      Delete
    </Button>
  </Modal.Footer>
</Modal>
    </>
  );
}

export default withAuth(ProposalEditor);
