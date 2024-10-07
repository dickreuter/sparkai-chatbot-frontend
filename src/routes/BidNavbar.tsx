import React, { useContext, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import { BidContext } from "../views/BidWritingStateManagerView";
import { faArrowLeft, faCheckCircle, faEdit, faEye, faTimesCircle, faUsers } from '@fortawesome/free-solid-svg-icons';
import "./BidNavbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuthUser } from "react-auth-kit";

const BidNavbar = () => {
  const { sharedState } = useContext(BidContext);
  const { isLoading, saveSuccess, bidInfo } = sharedState;
 
  const getAuth = useAuthUser();
  const [auth, setAuth] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    contributors,
  } = sharedState;
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('lastActiveTab') || '/bid-extractor';
  });

  const [currentUserPermission, setCurrentUserPermission] = useState('viewer');

  useEffect(() => {
    const authData = getAuth();
    setAuth(authData);
  }, [getAuth]);

  useEffect(() => {
    // Update active tab based on current location
    setActiveTab(location.pathname);
    localStorage.setItem('lastActiveTab', location.pathname);

    // Update user permission when bidInfo and auth changes
    if (auth && auth.email) {
      const permission = contributors[auth.email] || 'viewer'; 
      setCurrentUserPermission(permission);
      console.log("currentUserpermissionnav", permission);
    }
  }, [location, bidInfo, auth]);

  useEffect(() => {
    if (auth) {
      console.log("auth", auth);
    }
  }, [auth]);

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

  const handleBackClick = () => {
    navigate('/bids');
  };

  const handleTabClick = (path) => {
    setActiveTab(path);
    localStorage.setItem('lastActiveTab', path);
  };

  return (
    <div className="bidnav">
      <div className="bidnav-section">
        <button
          className="back-button"
          onClick={handleBackClick}
          title="Back to Bids"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <NavLink 
          to="/bid-extractor" 
          className={`bidnav-item ${activeTab === '/bid-extractor' ? 'active' : ''}`}
          onClick={() => handleTabClick('/bid-extractor')}
        >
          Bid Planner
        </NavLink>
        <NavLink 
          to="/question-crafter" 
          className={`bidnav-item ${activeTab === '/question-crafter' ? 'active' : ''}`}
          onClick={() => handleTabClick('/question-crafter')}
        >
          Q&A Generator
        </NavLink>
        <NavLink 
          to="/proposal" 
          className={`bidnav-item ${activeTab === '/proposal' ? 'active' : ''}`}
          onClick={() => handleTabClick('/proposal')}
        >
          Bid Compiler
        </NavLink>
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
        title={permissionDetails.description}
      >
        <FontAwesomeIcon icon={permissionDetails.icon} className="me-1" />
        {permissionDetails.text}
      </Button>
    </div>
  );
};

export default BidNavbar;