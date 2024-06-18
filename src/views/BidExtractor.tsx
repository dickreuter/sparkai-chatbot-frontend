import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button, Card, Col, Row, Spinner } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import './BidExtractor.css';
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';


const BidExtractor = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, setSharedState } = useContext(BidContext);
  const { bidInfo: contextBidInfo, backgroundInfo, questions } = sharedState;

  // Use a default value if bidInfo is null or empty
  const bidInfo = contextBidInfo || "Bid Name";
  const bidNameTempRef = useRef(bidInfo);
  
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const bidNameRef = useRef(null);

  const CHARACTER_LIMIT = 20;

  const location = useLocation();
  const bidData = location.state?.bid || '';

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const navigatedFromBidsTable = localStorage.getItem('navigatedFromBidsTable');
    if (navigatedFromBidsTable === 'true' && location.state?.fromBidsTable && bidData) {
      console.log("from bids table");
      setSharedState(prevState => ({
        ...prevState,
        bidInfo: bidData?.bid_title || '',
        backgroundInfo: bidData?.contract_information || ''
      }));
  
      if (bidData?.text) {
        console.log(bidData.text);
        const contentState = ContentState.createFromText(bidData.text);
        const newEditorState = EditorState.createWithContent(contentState);
        setSharedState(prevState => ({
          ...prevState,
          editorState: newEditorState
        }));
      }
  
      localStorage.setItem('navigatedFromBidsTable', 'false');
    }
  }, [location, bidData, setSharedState]);
  


  
  useEffect(() => {
    // Set the initial bid name from the context state
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
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setTimeout(() => {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(bidNameRef.current.childNodes[0], bidInfo.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        bidNameRef.current.focus();
      }, 0);
    }
  };

  const handleBlur = () => {
    setSharedState(prevState => ({
      ...prevState,
      bidInfo: bidNameTempRef.current
    }));
    setIsEditing(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
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
      setSharedState(prevState => ({
        ...prevState,
        questions: extractedQuestions
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

  const handleBackgroundInfoChange = (e) => {
    const newBackgroundInfo = e.target.value;
    setSharedState(prevState => ({
      ...prevState,
      backgroundInfo: newBackgroundInfo
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
          <Link to="/calculator">
            <button className="upload-button">
              Bid no/bid calculator
            </button>
          </Link>
          </div>
        </div>
        <div>
        <div className="input-container">
          <Row className="no-gutters mx-n2">
              <Col md={4} className="px-2">
                  <div className="card-effect-input-box">
                      <div className="input-box">
                          <div className="inputbox-container">
                              <h1 className="inputbox-title">Client Name:</h1>
                              <textarea className="inputbox-textarea"></textarea>
                          </div>
                      </div>
                  </div>
              </Col>
              <Col md={4} className="px-2">
                  <div className="card-effect-input-box">
                      <div className="input-box">
                          <div className="inputbox-container">
                              <h1 className="inputbox-title">Bid Qualification Result:</h1>
                              <textarea className="inputbox-textarea"></textarea>
                          </div>
                      </div>
                  </div>
              </Col>
              <Col md={4} className="px-2">
                  <div className="card-effect-input-box">
                      <div className="input-box">
                          <div className="inputbox-container">
                              <h1 className="inputbox-title">Opportunity Owner:</h1>
                              <textarea className="inputbox-textarea"></textarea>
                          </div>
                      </div>
                  </div>
              </Col>
          </Row>
          <Row className="no-gutters mt-3 mx-n2">
              <Col md={4} className="px-2">
                  <div className="card-effect-input-box">
                      <div className="input-box">
                          <div className="inputbox-container">
                              <h1 className="inputbox-title">Submission Deadline:</h1>
                              <textarea className="inputbox-textarea"></textarea>
                          </div>
                      </div>
                  </div>
              </Col>
              <Col md={4} className="px-2">
                  <div className="card-effect-input-box">
                      <div className="input-box">
                          <div className="inputbox-container">
                              <h1 className="inputbox-title">Bid Manager:</h1>
                              <textarea className="inputbox-textarea"></textarea>
                          </div>
                      </div>
                  </div>
              </Col>
              <Col md={4} className="px-2">
                  <div className="card-effect-input-box">
                      <div className="input-box">
                          <div className="inputbox-container">
                              <h1 className="inputbox-title">Contributors:</h1>
                              <textarea className="inputbox-textarea"></textarea>
                          </div>
                      </div>
                  </div>
              </Col>
          </Row>
      </div>

        <Row className="mt-5 mb-5">
            <Col md={6}>
              <div className="card-title-container mb-2">
                <div className="tooltip-container">
                  <i className="fas fa-info-circle tooltip-icon"></i>
                  <span className="tooltip-text-cd">
                    <strong style={{ marginLeft: "15px" }}>What are the client’s business issues that have led them to release this tender?</strong>
                    <ul>
                      <li>What will happen if they don’t address these issues?</li>
                      <li>What value results from addressing these issues?</li>
                      <li>What business objectives do they want to achieve?</li>
                      <li>Which objective is the most important to the client?</li>
                    </ul>
                  </span>
                </div>
                <h1 className="lib-title">Opportunity Information</h1>
              </div>
              <div className="question-extractor">
                <textarea
                  className="card-textarea"
                  placeholder="Enter client details here..."
                  value={backgroundInfo}
                  onChange={handleBackgroundInfoChange}
                ></textarea>
              </div>
            </Col>
            <Col md={6}>
              <div className="card-title-container mb-2">
                <div className="tooltip-container">
                    <i className="fas fa-info-circle tooltip-icon"></i>
                    <span className="tooltip-text">
                      <strong style={{marginLeft: "15px"}}>What are the client’s business issues that have led them to release this tender?</strong>
                      <ul>
                        <li>What products/services/applications can you provide to address the issue?</li>
                        <li>What outcomes would result from each of your suggestions?</li>
                        <li>When comparing the impact of your solution with the issues the client seeks to mitigate, which recommendation stands out as the most advantageous?</li>
                        <li>What makes you confident that your recommendation will be the right fit for the client?</li>
                        <li>Why should the client select your solution and not your competitors’?</li>
                      </ul>
                    </span>
                </div>
                <h1 className="lib-title">Compliance Requirements</h1>
              </div>
              <div className="question-extractor">
                <textarea className="card-textarea" placeholder="Enter bid proposition here..."></textarea>
              </div>
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
      {loading ? (
    <div className="loading-spinner">
      <Spinner animation="border" variant="primary" style={{ width: '1.5rem', height: '1.5rem' }} />
    </div>
  ) : (
        <>
          <Button
            className={`upload-button`}
            onClick={() => document.getElementById("fileInput").click()}
          >
            Retrieve Questions
          </Button>
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </>
      )}
    </div>
    <div className="question-extractor-flex mb-5">
      <div className="question-list">
        {questions.length === 0 ? (
          <>
            <div className="question-item">Question 1</div>
            <div className="question-item">Question 2</div>
            <div className="question-item">Question 3</div>
            <div className="question-item">Question 4</div>
            <div className="question-item">Question 5</div>
            <div className="question-item">Question 6</div>
          </>
        ) : (
          questions.map((question, index) => (
            <div key={index} className="question-item">
              {question}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
</Col>
    </Row>
       
        </div>
      </div>
    </div>
  );
}

export default withAuth(BidExtractor);
