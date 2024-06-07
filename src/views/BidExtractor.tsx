import React, { useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { faEye, faBook, faInfo } from '@fortawesome/free-solid-svg-icons';
import DashboardCard from "../components/DashboardCard.tsx";
import { faFileSignature, faComments } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import handleGAEvent from '../utilities/handleGAEvent';
import BidCard from "../components/BidCard.tsx";
import { Card, Col, Row } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import './BidExtractor.css'; // Assuming you put your styles here
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { useLocation } from 'react-router-dom';

const BidExtractor = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);

  const [bidName, setBidName] = useState(localStorage.getItem('bidInfo') || 'Bid Name');
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const bidNameRef = useRef(null);
  const bidNameTempRef = useRef(bidName);

  const CHARACTER_LIMIT = 20;

  /////////////  COOKIES   //////////////////////////////////////////////////////////////////////////////////////////
  const location = useLocation();
  const bidData = location.state?.bid || ' ';

  const [bidInfo, setBidInfo] = useState(
    localStorage.getItem('bidInfo') || ''
  );

  const [backgroundInfo, setBackgroundInfo] = useState(
    localStorage.getItem('backgroundInfo') || ''
  );

  const [questions, setQuestions] = useState([]);


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const handleBidNameChange = (e) => {
    const newText = e.target.innerText.replace(/\n/g, ''); // Remove new lines
    if (newText.length <= CHARACTER_LIMIT) {
      bidNameTempRef.current = newText;
    } else {
      e.target.innerText = bidNameTempRef.current; // Revert to the previous state if limit exceeded
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent the default action (adding a new line)
    }
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setTimeout(() => {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(bidNameRef.current.childNodes[0], bidName.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        bidNameRef.current.focus();
      }, 0);
    }
  };

  const handleBlur = () => {
    setBidName(bidNameTempRef.current);
    setBidInfo(bidNameTempRef.current);
    localStorage.setItem('bidInfo', bidNameTempRef.current);
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing) {
      bidNameRef.current.innerText = bidName;
    }
  }, [isEditing, bidName]);

  //////////////////////////// LOAD BID ///////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const navigatedFromBidsTable = localStorage.getItem('navigatedFromBidsTable');

    if (navigatedFromBidsTable === 'true' && location.state?.fromBidsTable && bidData) {


      // Update form states with data from navigation or provide default values
      setBidInfo(bidData?.bid_title || '');
      setBackgroundInfo(bidData?.contract_information || '');


      // Update local storage to match the navigation data
      localStorage.setItem('bidInfo', bidData?.bid_title || '');
      localStorage.setItem('backgroundInfo', bidData?.contract_information || '');


      localStorage.setItem('navigatedFromBidsTable', 'false');

      localStorage.getItem('bidInfo') || '';
      localStorage.getItem('backgroundInfo') || '';


    } 
  }, [location, bidData]);

  // Update local storage and handle session flag on form changes
  useEffect(() => {
    localStorage.setItem('bidInfo', bidInfo);
    localStorage.setItem('backgroundInfo', backgroundInfo);
  }, [bidInfo, backgroundInfo]);

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
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
  
      console.log(result);
  
      const extractedQuestions = result.data.filter(question => question.trim() !== '');
      console.log("extracted questions:");
      console.log(extractedQuestions);
      setQuestions(extractedQuestions);
      
    } catch (error) {
      console.error("Error extracting questions:", error);
    }
  };
  

  useEffect(() => {
    // Perform side-effect to update the questions
    if (questions.length > 0) {
      console.log("Questions updated:", questions);
    }
  }, [questions]);


  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <BidNavbar />
        <div className="mb-3">
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
              {bidName}
            </span>
            <button className="edit-tag" onClick={toggleEditing}>
              edit
            </button>
          </h1>
        </div>
        <div>
          <Row>
            <Col className="col-3-5">
              <div>
                <h1 className="lib-title mb-3">Upload RFP</h1>
                <div className="upload-rfp" onClick={() => document.getElementById('fileInput').click()}>
                <input 
                  type="file" 
                  id="fileInput" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
                <div className="upload-placeholder">
                  <span className="upload-cross">+</span>
                </div>
              </div>

              </div>
            </Col>
            <Col className="col-8-5">
            <div>
              <h1 className="lib-title mb-3">Question Extractor</h1>
              <div className="question-extractor-flex">
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
                <h1 className="lib-title">Client Details</h1>
              </div>
              <div className="question-extractor">
                <textarea
                  className="card-textarea"
                  placeholder="Enter client details here..."
                  value={backgroundInfo}
                  onChange={(e) => setBackgroundInfo(e.target.value)}
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
                  <h1 className="lib-title">Bid Proposition</h1>
                </div>
                <div className="question-extractor">
                  <textarea className="card-textarea" placeholder="Enter bid proposition here..."></textarea>
                </div>
              </Col>
            </Row>
        </div>
        
      </div>
    </div>
  );
}

export default withAuth(BidExtractor);
