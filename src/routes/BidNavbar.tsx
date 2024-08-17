import React, { useContext, useEffect, useRef, useState } from "react";
import { NavLink } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import { BidContext } from "../views/BidWritingStateManagerView";
import { faCheckCircle, faEdit, faEye, faTimesCircle, faUsers } from '@fortawesome/free-solid-svg-icons';
import "./BidNavbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { useAuthUser } from "react-auth-kit";

const BidNavbar = () => {
  const { sharedState, setSharedState, getBackgroundInfo } = useContext(BidContext);
  const { isLoading, saveSuccess } = sharedState;
 
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  
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



  const currentUserPermission = contributors[auth.email] || 'viewer'; 
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
    <div className="bidnav">
      <div className="bidnav-section">
        <NavLink to="/bid-extractor" className="bidnav-item" activeClassName="active">Bid Planner</NavLink>
        <NavLink to="/question-crafter" className="bidnav-item" activeClassName="active">Q&A Generator </NavLink>
        <NavLink to="/proposal" className="bidnav-item" activeClassName="active">Bid Complier</NavLink>
        <div className="status-indicator mt-2">
          {isLoading ? (
            <Spinner animation="border" size="lg" style={{ width: '1.4rem', height: '1.4rem' }} />
          ) : saveSuccess === true ? (
            <FontAwesomeIcon
              icon={faCheckCircle}
              style={{ color: 'green', fontSize: '1.4rem' }}
              title="Draft saved"
            />
          ) : saveSuccess === false ? (
            <FontAwesomeIcon
              icon={faTimesCircle}
              style={{ color: 'red', fontSize: '1.4rem' }}
              title="Failed to save"
            />
          ) : null}
        </div>
      </div>
      <Button
            className="upload-button mt-2"
            style={{ textTransform: 'none' }}
            onClick={(e) => e.preventDefault()}
            title={permissionDetails.description}  // This adds a native tooltip
          >
            <FontAwesomeIcon icon={permissionDetails.icon} className="me-1" />
            {permissionDetails.text}
          </Button>
          
    </div>
  );
};

export default BidNavbar;
