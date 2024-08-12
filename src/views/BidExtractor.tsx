import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { useLocation, Link } from 'react-router-dom';
import { Button, Card, Col, Form, Modal, Row, Spinner, Tooltip } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import './BidExtractor.css';
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { EditorState, ContentState,  convertFromRaw, convertToRaw  } from 'draft-js';
import { displayAlert } from '../helper/Alert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { FormControl, InputLabel, Select } from "@mui/material";
import ContributorModal from "../components/ContributorModal.tsx";
import { Snackbar } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye, faUsers } from "@fortawesome/free-solid-svg-icons";

const BidExtractor = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, setSharedState, getBackgroundInfo } = useContext(BidContext);
  const { 
    bidInfo: contextBidInfo, 
    opportunity_information, 
    compliance_requirements, 
    questions, 
    bid_qualification_result, 
    client_name, 
    opportunity_owner, 
    submission_deadline, 
    bid_manager, 
    contributors,
    original_creator
  } = sharedState;

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

  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [showContributorModal, setShowContributorModal] = useState(false);

  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const currentUserPermission = contributors[currentUserEmail] || 'viewer'; // Default to 'viewer' if not found
  const canUserEdit = currentUserPermission === "admin" || currentUserPermission === "editor";

  const showViewOnlyMessage = () => {
    console.log(currentUserPermission);
    displayAlert("You only have permission to view this bid.", 'danger');
  };


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
    const fetchOrganizationUsers = async () => {
      try {
        const response = await axios.get(`http${HTTP_PREFIX}://${API_URL}/organization_users`, {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });
        setOrganizationUsers(response.data);
        console.log(contributors);
      } catch (err) {
        console.error('Error fetching organization users:', err);
      }
    };

    fetchOrganizationUsers();
  }, [tokenRef]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http${HTTP_PREFIX}://${API_URL}/profile`,  {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });
        setCurrentUserEmail(response.data.email);
       
      } catch (err) {
        console.log('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [tokenRef]);



  const handleAddContributor = (user, permission) => {
    setSharedState(prevState => ({
      ...prevState,
      contributors: {
        ...prevState.contributors,
        [user]: permission
      }
    }));
  };

  const handleRemoveContributor = (email) => {
    setSharedState(prevState => {
      const updatedContributors = { ...prevState.contributors };
      delete updatedContributors[email];
      return { ...prevState, contributors: updatedContributors };
    });
  };

  const handleUpdateContributor = (email, newPermission) => {
    setSharedState(prevState => ({
      ...prevState,
      contributors: {
        ...prevState.contributors,
        [email]: newPermission
      }
    }));
  };


  
  const ContributorsCard = () => {
    const contributorCount = Object.keys(contributors).length;
  
    return (
      <Card className="mb-4 same-height-card">
        <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
          <h1 className="inputbox-title mb-0 mt-1">Contributors:</h1>
          
            <Button
              className="p-0 contributors-button"
              variant="link"
              onClick={() => setShowContributorModal(true)}
              style={{
                fontSize: '1rem',
                color: '#4a4a4a',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                textDecoration: 'none'
              }}
            >
              <i className="fas fa-plus"></i>
            </Button>
          
        </Card.Header>
        <Card.Body className="py-2 px-3 d-flex">
          <div
            
          >
           This Proposal has  {contributorCount} Contributor{contributorCount !== 1 ? 's' : ''}
          </div>
        </Card.Body>
      </Card>
    );
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
  
      setSharedState(prevState => {
        const original_creator = bidData?.original_creator || currentUserEmail;
        let contributors = bidData?.contributors || {};
        
        if (!bidData?.original_creator || Object.keys(contributors).length === 0) {
          if (currentUserEmail && currentUserEmail !== '') {
            contributors = { [currentUserEmail]: 'admin' };
          }
        }
  
        return {
          ...prevState,
          bidInfo: bidData?.bid_title || '',
          opportunity_information: bidData?.opportunity_information?.trim() || '',
          compliance_requirements: bidData?.compliance_requirements?.trim() || '',
          client_name: bidData?.client_name || '',
          bid_qualification_result: bidData?.bid_qualification_result || '',
          questions: bidData?.questions || '',
          opportunity_owner: bidData?.opportunity_owner || '',
          submission_deadline: bidData?.submission_deadline || '',
          bid_manager: bidData?.bid_manager || '',
          contributors: contributors,
          original_creator: original_creator,
          object_id: bidData?._id || '',
          documents: parsedDocuments,
          currentDocumentIndex: 0
        };
      });
  
      localStorage.setItem('navigatedFromBidsTable', 'false');
    } else if (initialBidName && initialBidName !== '') {
      // Update bidInfo with the initial bid name if it's provided and not empty
      // USER CREATES A NEW BID
      setSharedState(prevState => ({
        ...prevState,
        bidInfo: initialBidName,
        original_creator: currentUserEmail,
        contributors: currentUserEmail ? { [currentUserEmail]: 'admin' } : {}
      }));
    }
  }, [location, bidData, setSharedState, initialBidName, currentUserEmail]);

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
    if (!canUserEdit) {
      showViewOnlyMessage();
      return;
    }
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

  const handleEditAttempt = (handler) => (e) => {
    if (!canUserEdit) {
      showViewOnlyMessage();
      return;
    }
    handler(e);
  };

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

 

  const clientNameRef = useRef(null);
  const submissionDeadlineRef = useRef(null);
  const bidManagerRef = useRef(null);
  const opportunityOwnerRef = useRef(null);
  const bidQualificationResultRef = useRef(null);
  const opportunityInformationRef = useRef(null);
  const complianceRequirementsRef = useRef(null);


  const handleDisabledClick = (e) => {
    if (!canUserEdit) {
      e.preventDefault();
      e.stopPropagation();
      showViewOnlyMessage();
    }
  };

  const createClickHandler = (ref) => (e) => {
    if (!canUserEdit && ref.current && ref.current.contains(e.target)) {
      handleDisabledClick(e);
    }
  };

  useEffect(() => {
    const refs = [
      clientNameRef,
      submissionDeadlineRef,
      bidManagerRef,
      opportunityOwnerRef,
      bidQualificationResultRef,
      opportunityInformationRef,
      complianceRequirementsRef
    ];

    const clickHandlers = refs.map(ref => createClickHandler(ref));

    refs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.addEventListener('click', clickHandlers[index]);
      }
    });

    return () => {
      refs.forEach((ref, index) => {
        if (ref.current) {
          ref.current.removeEventListener('click', clickHandlers[index]);
        }
      });
    };
  }, [canUserEdit]);

  const wrappedHandlers = {
    handleClientNameResultChange: (e) => {
      if (canUserEdit) handleEditAttempt(handleClientNameResultChange)(e);
      else handleDisabledClick(e);
    },
    handleSubmissionDeadlineChange: (e) => {
      if (canUserEdit) handleEditAttempt(handleSubmissionDeadlineChange)(e);
      else handleDisabledClick(e);
    },
    handleBidManagerChange: (e) => {
      if (canUserEdit) handleEditAttempt(handleBidManagerChange)(e);
      else handleDisabledClick(e);
    },
    handleOpportunityOwnerChange: (e) => {
      if (canUserEdit) handleEditAttempt(handleOpportunityOwnerChange)(e);
      else handleDisabledClick(e);
    },
    handleBidQualificationResultChange: (e) => {
      if (canUserEdit) handleEditAttempt(handleBidQualificationResultChange)(e);
      else handleDisabledClick(e);
    },
    handleOpportunityInformationChange: (e) => {
      if (canUserEdit) handleEditAttempt(handleOpportunityInformationChange)(e);
      else handleDisabledClick(e);
    },
    handleComplianceRequirementsChange: (e) => {
      if (canUserEdit) handleEditAttempt(handleComplianceRequirementsChange)(e);
      else handleDisabledClick(e);
    },
  };



  const getPermissionDetails = (permission) => {
    switch (permission) {
      case 'admin':
        return {
          icon: faUsers,
          text: 'Admin',
          description: 'You have full access to edit and manage this proposal.'
        };
      case 'editor':
        return {
          icon: faEdit,
          text: 'Editor',
          description: 'You can edit this proposal but cannot change permissions.'
        };
      default:
        return {
          icon: faEye,
          text: 'Viewer',
          description: 'You can view this proposal but cannot make changes.'
        };
    }
  };

  const permissionDetails = getPermissionDetails(currentUserPermission);

  
  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <BidNavbar />
        <div className="proposal-header mt-3 mb-2">
          <h1 className='heavy'>
            <span
             contentEditable={isEditing && canUserEdit}
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
         
          </div >
        <div>
        <div className="input-container mt-3">
        <Row className="no-gutters mx-n2">
        <Col md={4} className="px-2">
            <Card className="mb-4 same-height-card">
              <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                <h1 className="inputbox-title mb-0 mt-1">Client Name:</h1>
              </Card.Header>
              <Card.Body className="py-0 pl-2">
                <div ref={clientNameRef} style={{ width: '100%', height: '100%' }}>
                  <textarea
                    className="form-control single-line-textarea"
                    value={sharedState.client_name}
                    onChange={wrappedHandlers.handleClientNameResultChange}
                    disabled={!canUserEdit}
                  ></textarea>
                </div>
              </Card.Body>
            </Card>
          </Col>

              <Col md={4} className="px-2">
                <Card className="mb-4 same-height-card">
                  <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                    <h1 className="inputbox-title mb-0 mt-1">Submission Deadline:</h1>
                  </Card.Header>
                  <Card.Body className="py-0 px-1" ref={submissionDeadlineRef}>
                    <input
                      type="date"
                      className="form-control date-textarea"
                      value={sharedState.submission_deadline}
                      onChange={wrappedHandlers.handleSubmissionDeadlineChange}
                      style={{border: "none"}}
                      onClick={handleDisabledClick}
                      disabled={!canUserEdit}
                    />
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4} className="px-2">
                <Card className="mb-4 same-height-card">
                  <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                    <h1 className="inputbox-title mb-0 mt-1">Bid Manager:</h1>
                  </Card.Header>
                  <Card.Body className="py-0 pl-2" ref={bidManagerRef}>
                    <textarea
                      className="form-control single-line-textarea"
                      value={sharedState.bid_manager}
                      onChange={wrappedHandlers.handleBidManagerChange}
                      onClick={handleDisabledClick}
                      disabled={!canUserEdit}
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
                  <Card.Body className="py-0 pl-2" ref={opportunityOwnerRef}>
                    <textarea
                      className="form-control single-line-textarea"
                      value={sharedState.opportunity_owner}
                      onChange={wrappedHandlers.handleOpportunityOwnerChange}
                      onClick={handleDisabledClick}
                      disabled={!canUserEdit}
                    ></textarea>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4} className="px-2">
                <ContributorsCard />
              </Col>

              <Col md={4} className="px-2">
                <Card className="mb-4 same-height-card">
                  <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                    <h1 className="inputbox-title mb-0 mt-1">Bid Qualification Result:</h1>
                  </Card.Header>
                  <Card.Body className="py-0 pl-2" ref={bidQualificationResultRef}>
                    <textarea
                      className="form-control single-line-textarea"
                      value={sharedState.bid_qualification_result}
                      onChange={wrappedHandlers.handleBidQualificationResultChange}
                      onClick={handleDisabledClick}
                      disabled={!canUserEdit}
                    ></textarea>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>

          <Row className="mt-4 mb-4">
            <Col md={6}>
              <Card className="mb-4 custom-grey-border">
                <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                  <h1 className="requirements-title ">Opportunity Information</h1>
                  {/* ... (tooltip remains the same) ... */}
                </Card.Header>
                <Card.Body className="px-0 py-1" ref={opportunityInformationRef}>
                  <textarea
                    className="form-control requirements-textarea"
                    placeholder="Enter background info here..."
                    value={opportunity_information || ''}
                    onChange={wrappedHandlers.handleOpportunityInformationChange}
                    disabled={!canUserEdit}
                  ></textarea>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-4 custom-grey-border">
                <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                  <h1 className=" requirements-title ">Compliance Requirements</h1>
                  {/* ... (tooltip remains the same) ... */}
                </Card.Header>
                <Card.Body className="px-0 py-1" ref={complianceRequirementsRef}>
                  <textarea
                    className="form-control requirements-textarea"
                    placeholder="Enter compliance requirements here..."
                    value={compliance_requirements || ''}
                    onChange={wrappedHandlers.handleComplianceRequirementsChange}
                    disabled={!canUserEdit}
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


<ContributorModal
  show={showContributorModal}
  onHide={() => setShowContributorModal(false)}
  onAddContributor={handleAddContributor}
  onUpdateContributor={handleUpdateContributor}
  onRemoveContributor={handleRemoveContributor}
  organizationUsers={organizationUsers}
  currentContributors={contributors}
  currentUserEmail={currentUserEmail}
  currentUserPermission={currentUserPermission}
/>



        </div>
      </div>
    </div>


    
  );
}

export default withAuth(BidExtractor);
