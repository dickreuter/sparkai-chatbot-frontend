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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const BidExtractor = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);

  const [bidName, setBidName] = useState('Bid Name');
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const bidNameRef = useRef(null);
  const bidNameTempRef = useRef(bidName);

  const CHARACTER_LIMIT = 20;

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
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing) {
      bidNameRef.current.innerText = bidName;
    }
  }, [isEditing, bidName]);

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <BidNavbar />
        <div className="mb-4">
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
        <div className="library-container">
            <Row>
              <Col md={3}>
               <h1 className="lib-title mb-3">Upload RFP</h1>
                <div className="upload-rfp">
                  <div className="upload-placeholder">
                    <span className="upload-cross">+</span>
                  </div>
                 
                </div>
              </Col>
              <Col md={9}>
              <div style={{marginLeft: "30px"}}>
              <h1 className="lib-title mb-3">Question Extractor</h1>
                <div className="question-extractor">
                
                  <div className="question-list">
                    <div className="question-item">Question 1</div>
                    <div className="question-item">Question 2</div>
                    <div className="question-item">Question 3</div>
                    <div className="question-item">Question 4</div>
                    <div className="question-item">Question 5</div>
                    <div className="question-item">Question 6</div>
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
                        <strong style={{marginLeft: "15px"}}>What are the client’s business issues that have led them to release this tender?</strong>
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
                  <textarea className="card-textarea" placeholder="Enter client details here..."></textarea>
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
