import React, { useContext, useEffect, useRef, useState } from "react";
import { NavLink } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import { BidContext } from "../views/BidWritingStateManagerView";
import { useAuthUser } from 'react-auth-kit';
import "./BidNavbar.css";

const BidNavbar = () => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Correct use of hooks
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState, setSharedState } = useContext(BidContext);
  const { bidInfo, backgroundInfo, editorState } = sharedState;

  const saveProposal = async () => {
    setIsLoading(true);
    const editorContentState = editorState.getCurrentContent();
    const editorText = editorContentState.getPlainText('\n');
  
    const formData = new FormData();
    formData.append('bid_title', bidInfo);
    formData.append('text', editorText);
    formData.append('status', 'ongoing');
    formData.append('contract_information', backgroundInfo);
    formData.append('client_name', 'test');
    formData.append('bid_qualification_result', 'test');
    formData.append('opportunity_owner', 'test');
    formData.append('bid_manager', 'test');
    formData.append('contributors', 'test');
    formData.append('submission_deadline', 'test');
    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/upload_bids`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000); // Reset after 3 seconds
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving proposal:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="bidnav">
    <div className="bidnav-section">
    <NavLink to="/bid-extractor" className="bidnav-item" activeClassName="active">Bid Planner</NavLink>
      <NavLink to="/question-crafter" className="bidnav-item" activeClassName="active">Bid Response</NavLink>
      <NavLink to="/proposal" className="bidnav-item" activeClassName="active">Proposal</NavLink>
      <Button
            variant={isSaved ? "success" : "primary"}
            onClick={saveProposal}
            className={`mt-1 upload-button ${isSaved && 'saved-button'}`}
            disabled={isLoading || isSaved}
          >
            {isSaved ? "Saved" : "Save Bid"}
          </Button>
    </div>
    
  </div>
  );
};

export default BidNavbar;
