import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { useLocation, Link } from 'react-router-dom';
import { Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import './BidExtractor.css';
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { EditorState, ContentState,  convertFromRaw, convertToRaw  } from 'draft-js';
import { displayAlert } from '../helper/Alert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const BidExtractor = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, setSharedState, getBackgroundInfo } = useContext(BidContext);
  const { bidInfo: contextBidInfo, opportunity_information, compliance_requirements, questions, bid_qualification_result, client_name, opportunity_owner, submission_deadline, bid_manager, contributors } = sharedState;
  const CHARACTER_LIMIT = 20;

  const location = useLocation();
  const bidData = location.state?.bid || '';
  const initialBidName = location.state?.bidName // Retrieve bidName from location state

  // Initialize bidInfo with the initial bid name or context bid info
  const bidInfo = contextBidInfo || initialBidName;
  const bidNameTempRef = useRef(bidInfo);

  const [isEditing, setIsEditing] = useState(false);
  const bidNameRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [existingBidNames, setExistingBidNames] = useState([]);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedQuestions, setPastedQuestions] = useState('');

  const removeQuestion = (indexToRemove) => {
    const updatedQuestions = questions.split(',')
      .map(question => question.trim())
      .filter((_, index) => index !== indexToRemove);
  
    setSharedState(prevState => ({
      ...prevState,
      questions: updatedQuestions.join(', ')
    }));
  };
  

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRetrieveQuestions = () => {
   
    document.getElementById("fileInput").click();
    handleClose();
  };
  

  const handlePasteQuestions = () => {
    setShowPasteModal(true);
    handleClose();
  };


  useEffect(() => {
    const fetchExistingBidNames = async () => {
      try {
        const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/get_bids_list/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
            },
          });
        if (response.data && response.data.bids) {
          setExistingBidNames(response.data.bids.map(bid => bid.bid_title));
        }
      } catch (error) {
        console.error("Error fetching bid names:", error);
      }
    };

    fetchExistingBidNames();
  }, [tokenRef]);


  useEffect(() => {
    const navigatedFromBidsTable = localStorage.getItem('navigatedFromBidsTable');
    if (navigatedFromBidsTable === 'true' && location.state?.fromBidsTable && bidData) {
      console.log("from bids table");
      console.log(bidData);
  
      const parsedDocuments = bidData?.documents?.map(doc => ({
        name: doc.name,
        editorState: doc.text 
          ? EditorState.createWithContent(ContentState.createFromText(doc.text))
          : EditorState.createEmpty()
      })) || [{ name: 'Document 1', editorState: EditorState.createEmpty() }];
  
      setSharedState(prevState => ({
        ...prevState,
        bidInfo: bidData?.bid_title || '',
        opportunity_information: bidData?.opportunity_information.trim() || '',
        compliance_requirements: bidData?.compliance_requirements.trim() || '',
        client_name: bidData?.client_name || '',
        bid_qualification_result: bidData?.bid_qualification_result || '',
        questions: bidData?.questions || '',
        opportunity_owner: bidData?.opportunity_owner || '',
        submission_deadline: bidData?.submission_deadline || '',
        bid_manager: bidData?.bid_manager || '',
        contributors: bidData?.contributors || '',
        object_id: bidData?._id || '',
        documents: parsedDocuments,
        currentDocumentIndex: 0
      }));


      {/*
      if (bidData?.text) {
        console.log(bidData.text);
        const contentState = ContentState.createFromText(bidData.text);
        const newEditorState = EditorState.createWithContent(contentState);
        setSharedState(prevState => ({
          ...prevState,
          editorState: newEditorState
        }));
      }
        */}
  
      localStorage.setItem('navigatedFromBidsTable', 'false');
    } else if (initialBidName && initialBidName !== '') {
      // Update bidInfo with the initial bid name if it's provided and not empty
      setSharedState(prevState => ({
        ...prevState,
        bidInfo: initialBidName
      }));
    }
  }, [location, bidData, setSharedState, initialBidName]);

  useEffect(() => {
    console.log(sharedState);
  }, [sharedState]);

  useEffect(() => {
    bidNameTempRef.current = bidInfo;
    if (bidNameRef.current) {
      bidNameRef.current.innerText = bidInfo;
    }
  }, [bidInfo]);

  const handleBidNameChange = (e) => {
    const newText = e.target.innerText.replace(/\n/g, '');
    if (newText.length <= CHARACTER_LIMIT) {
      bidNameTempRef.current = newText;
    } else {
      e.target.innerText = bidNameTempRef.current;
      displayAlert(`Bid name cannot exceed ${CHARACTER_LIMIT} characters`, 'warning');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const toggleEditing = () => {
    if (!isEditing) {
      setIsEditing(!isEditing);
      setTimeout(() => {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(bidNameRef.current.childNodes[0], bidInfo.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        bidNameRef.current.focus();
      }, 0);
    } else {
      // Check if bid name is empty or already exists
      const newBidName = bidNameRef.current.innerText.trim();
      if (!newBidName) {
        displayAlert('Bid name cannot be empty', 'warning');
        return;
      }
      if (newBidName.length > CHARACTER_LIMIT) {
        displayAlert(`Bid name cannot exceed ${CHARACTER_LIMIT} characters`, 'warning');
        return;
      }
      console.log(newBidName);
      console.log(contextBidInfo);
      if (existingBidNames.includes(newBidName) && newBidName !== contextBidInfo) {
        displayAlert('Bid name already exists', 'warning');
        return;
      }
      // Add any other necessary validation here
      
      setSharedState(prevState => ({
        ...prevState,
        bidInfo: newBidName
      }));
      setIsEditing(false);
    }
  };
  

  const handleBlur = () => {
    const newBidName = bidNameTempRef.current.trim();
    if (!newBidName) {
      displayAlert('Bid name cannot be empty', 'warning');
      bidNameRef.current.innerText = bidInfo; // Revert to the previous valid bid name
      return;
    }
    if (existingBidNames.includes(newBidName) && newBidName !== contextBidInfo) {
      displayAlert('Bid name already exists', 'warning');
      bidNameRef.current.innerText = bidInfo; // Revert to the previous valid bid name
      return;
    }
    setSharedState(prevState => ({
      ...prevState,
      bidInfo: newBidName
    }));
    setIsEditing(false);
  };
  

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/extract_questions_from_pdf`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
  
      const extractedQuestions = result.data.filter((question: string) => question.trim() !== '');
      const questionsString = extractedQuestions.join(',');
      setSharedState(prevState => ({
        ...prevState,
        questions: questionsString
      }));
    } catch (error) {
      console.error("Error extracting questions:", error);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (questions.length > 0) {
      console.log("Questions updated:", questions);
    }
  }, [questions]);

  const handleOpportunityInformationChange = (e) => {
    const newOpportunityInformation = e.target.value;
    setSharedState(prevState => ({
      ...prevState,
      opportunity_information: newOpportunityInformation
    }));
  };

  const handleComplianceRequirementsChange = (e) => {
    const newComplianceRequirements = e.target.value;
    setSharedState(prevState => ({
      ...prevState,
      compliance_requirements: newComplianceRequirements
    }));
  };

  const handleBidQualificationResultChange = (e) => {
    const newBidQualificationResult = e.target.value;
    setSharedState(prevState => ({
      ...prevState,
      bid_qualification_result: newBidQualificationResult
    }));
  };

  const handleClientNameResultChange = (e) => {
    const newClientName = e.target.value;
    setSharedState(prevState => ({
      ...prevState,
      client_name: newClientName
    }));
  };

  const handleOpportunityOwnerChange = (e) => {
    const newOpportunityOwner = e.target.value;
    setSharedState(prevState => ({
      ...prevState,
      opportunity_owner: newOpportunityOwner
    }));
  };

  const handleSubmissionDeadlineChange = (newDate) => {
    setSharedState((prevState) => ({
      ...prevState,
      submission_deadline: newDate
    }));
  };
  
  const handleBidManagerChange = (e) => {
    const newBidManager = e.target.value;
    setSharedState(prevState => ({
      ...prevState,
      bid_manager: newBidManager
    }));
  };

  const handleContributorsChange = (e) => {
    const newContributors = e.target.value;
    setSharedState(prevState => ({
      ...prevState,
      contributors: newContributors
    }));
  };

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <BidNavbar />
        <div className="proposal-header mt-3 mb-2">
          <h1 className='heavy'>
            <span
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={handleBlur}
              onInput={handleBidNameChange}
              onKeyDown={handleKeyDown}
              className={isEditing ? 'editable' : ''}
              ref={bidNameRef}
            >
              {bidInfo}
            </span>
            <button className="edit-tag" onClick={toggleEditing}>
              edit
            </button>
          </h1>
          <div >
         
          </div>
        </div>
        <div>
        <div className="input-container">
  <Row className="no-gutters mx-n2">
    <Col md={4} className="px-2">
      <Card className="mb-4 same-height-card">
      <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
          <h1 className="inputbox-title mb-0 mt-1">Client Name:</h1>
        </Card.Header>
        <Card.Body className="py-0 pl-2">
          <textarea
            className="form-control single-line-textarea"
            value={sharedState.client_name}
            onChange={handleClientNameResultChange}
          ></textarea>
        </Card.Body>
      </Card>
    </Col>

    <Col md={4} className="px-2">
      <Card className="mb-4 same-height-card">
      <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
          <h1 className="inputbox-title mb-0 mt-1">Submission Deadline:</h1>
        </Card.Header>
        <Card.Body className="py-0 pl-2">
          <input
            type="date"
            className="form-control"
            value={sharedState.submission_deadline}
            onChange={(e) => handleSubmissionDeadlineChange(e.target.value)}
            style={{border: "none"}}
          />
        </Card.Body>
      </Card>
    </Col>

    <Col md={4} className="px-2">
      <Card className="mb-4 same-height-card">
      <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
          <h1 className="inputbox-title mb-0 mt-1">Bid Manager:</h1>
        </Card.Header>
        <Card.Body className="py-0 pl-2">
          <textarea
            className="form-control single-line-textarea"
            value={sharedState.bid_manager}
            onChange={handleBidManagerChange}
          ></textarea>
        </Card.Body>
      </Card>
    </Col>
  </Row>
  <Row className="no-gutters mt-0 mx-n2">
    <Col md={4} className="px-2">
      <Card className="mb-4 same-height-card">
      <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
          <h1 className="inputbox-title mb-0 mt-1">Opportunity Owner:</h1>
        </Card.Header>
        <Card.Body className="py-0 pl-2">
          <textarea
            className="form-control single-line-textarea"
            value={sharedState.opportunity_owner}
            onChange={handleOpportunityOwnerChange}
          ></textarea>
        </Card.Body>
      </Card>
    </Col>

    <Col md={4} className="px-2">
      <Card className="mb-4 same-height-card">
      <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
          <h1 className="inputbox-title mb-0 mt-1">Contributors:</h1>
        </Card.Header>
        <Card.Body className="py-0 pl-2">
          <textarea
            className="form-control single-line-textarea"
            value={sharedState.contributors}
            onChange={handleContributorsChange}
          ></textarea>
        </Card.Body>
      </Card>
    </Col>

    <Col md={4} className="px-2">
      <Card className="mb-4 same-height-card">
      <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
          <h1 className="inputbox-title mb-0 mt-1">Bid Qualification Result:</h1>
        </Card.Header>
        <Card.Body className="py-0 pl-2">
          <textarea
            className="form-control single-line-textarea"
            value={sharedState.bid_qualification_result}
            onChange={handleBidQualificationResultChange}
          ></textarea>
        </Card.Body>
      </Card>
    </Col>
  </Row>
</div>




      <Row className="mt-4 mb-4">
  <Col md={6}>
    <Card className="mb-4">
    <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
        <h1 className="requirements-title mt-2">Opportunity Information</h1>
        <div className="tooltip-container mt-1">
          <div className="tooltip-icon-container">
            <i className="fas fa-info tooltip-icon"></i>
          </div>
          <span className="tooltip-text-cd">
            <strong>
           Give the AI context. Summarise the client’s key challenges, objectives, scope of work, etc. 

            </strong>
          </span>
        </div>
      </Card.Header>
      <Card.Body className="px-0 py-1">
        <textarea
          className="form-control requirements-textarea"
          placeholder="Enter background info here..."
          value={opportunity_information || ''}
          onChange={handleOpportunityInformationChange}
        ></textarea>
      </Card.Body>
    </Card>
  </Col>
  <Col md={6}>
    <Card className="mb-4">
    <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
        <h1 className=" requirements-title mt-2">Compliance Requirements</h1>
        <div className="tooltip-container mt-1">
          <div className="tooltip-icon-container">
            <i className="fas fa-info tooltip-icon"></i>
          </div>
          <span className="tooltip-text">
            <strong>
              Outline the essential compliance criteria and regulations relevant to the bid such as certifications or legal requirements that must be met to ensure it's directly referenced in the response.
            </strong>
          </span>
        </div>
      </Card.Header>
      <Card.Body className="px-0 py-1">
        <textarea
          className="form-control requirements-textarea"
          placeholder="Enter compliance requirements here..."
          value={compliance_requirements || ''}
          onChange={handleComplianceRequirementsChange}
        ></textarea>
      </Card.Body>
    </Card>
  </Col>
</Row>

          <Row>
         
          <Col md={12}>
  <div>
    <div className="proposal-header mb-2">
      <h1 className="lib-title mb-3">
        Question Extractor{" "}
        <span className="beta-label">beta</span>
      </h1>
      <div className="dropdown-container">
    {loading ? (
      <Spinner animation="border" variant="primary" style={{ width: '1.5rem', height: '1.5rem' }} />
    ) : (
      <>
        <Button
          className="upload-button"
          onClick={handleClick}
          style={{ outline: 'none' }}
          aria-controls="simple-menu"
          aria-haspopup="true"
        >
          Retrieve or Paste Questions
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <MenuItem onClick={handleRetrieveQuestions} style={{ fontFamily: '"ClashDisplay", sans-serif' }}>
            <i className="fas fa-download" style={{ marginRight: '10px' }}></i>
            Retrieve Questions
          </MenuItem>
          <MenuItem onClick={handlePasteQuestions} style={{ fontFamily: '"ClashDisplay", sans-serif' }}>
            <i className="fas fa-paste" style={{ marginRight: '13px' }}></i>
            Paste Questions
          </MenuItem>

        </Menu>
        <input
          type="file"
          id="fileInput"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </>
    )}
  </div>

    </div>
   

    <div className="question-extractor-flex mb-5">
      <div className="question-list">
        {questions === " " || questions === "" ? (
          <>
            <div className="question-item-default">Question 1</div>
            <div className="question-item-default">Question 2</div>
            <div className="question-item-default">Question 3</div>
            <div className="question-item-default">Question 4</div>
            <div className="question-item-default">Question 5</div>
            <div className="question-item-default">Question 6</div>
          </>
        ) : (
          questions.split(',').map((question, index) => (
            <div key={index} className="question-item">
              {question}
              <button
                className="remove-question-button"
                onClick={() => removeQuestion(index)}
              >
                &minus;
              </button>
            </div>
          ))
        )}
      </div>
    </div>

  </div>
</Col>
    </Row>
    <Modal show={showPasteModal} onHide={() => setShowPasteModal(false)} dialogClassName="paste-modal">
  <Modal.Header closeButton className="p-4">
    <Modal.Title>Paste Questions</Modal.Title>
  </Modal.Header>
  <Modal.Body className="p-4">
    <Form>
      <Form.Group>
        <Form.Label>Paste in some questions, make sure each one ends with a question mark.</Form.Label>
        <Form.Control
          as="textarea"
          rows={5}
          value={pastedQuestions}
          onChange={(e) => setPastedQuestions(e.target.value)}
        />
      </Form.Group>
    </Form>
    
    <Button
  className="upload-button mt-3"
  onClick={() => {
    const questionsArray = pastedQuestions.split('?')
      .map(question => question.trim())
      .filter(question => question.length > 0)
      .map(question => question.endsWith('?') ? question : `${question}?`);

    // Join all questions except the last one with a comma and then add the last question without a comma
    const formattedQuestions = questionsArray.slice(0, -1).map(question => `${question},`).concat(questionsArray.slice(-1));

    setSharedState((prevState) => ({
      ...prevState,
      questions: formattedQuestions.join(' ')
    }));
    setShowPasteModal(false);
  }}
>
  Save Changes
</Button>
  </Modal.Body>
 



  
</Modal>


        </div>
      </div>
    </div>


    
  );
}

export default withAuth(BidExtractor);
