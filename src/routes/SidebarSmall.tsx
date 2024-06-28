import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import "./SidebarSmall.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuthUser, useSignOut } from "react-auth-kit";
import {
  faHome,
  faShieldAlt,
  faQuestionCircle,
  faSignOutAlt,
  faBookOpen,
  faLayerGroup,
  faFileAlt,  // Icon representing documents or information
  faFileCircleQuestion, // Icon for questions
  faReply, // Icon for comments or responses
  faTachometerAlt,
  faFileContract, // Icon for proposals or contracts
  faComments,
  faCircleQuestion
} from '@fortawesome/free-solid-svg-icons';
// Import the image
import sidebarIcon from '../resources/images/mytender.io_badge.png';

const SideBarSmall = () => {
  const location = useLocation(); // Hook to get the current location

  // Function to determine if the link is active based on the current path
  const isActive = (path) => location.pathname === path;
  const signOut = useSignOut();

  return (
    <div className="sidebarsmall">
      <div>
        <Link to="/dashboard" className={`sidebarsmalllink ${isActive('/dashboard') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faTachometerAlt} />
          <span>Dashboard</span>
        </Link>
        <Link to="/bids" className={`sidebarsmalllink ${isActive('/bids') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>Bid Repository</span>
        </Link>
        <Link to="/library" className={`sidebarsmalllink ${isActive('/library') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faBookOpen} />
          <span>Library</span>
        </Link>
        <Link to="/chatResponse" className={`sidebarsmalllink ${isActive('/chatResponse') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faComments} />
          <span>Q/A Chat</span>
        </Link>
      </div>
      <div className="signout-container">
      <Link to="/howto" className={`sidebarsmalllink ${isActive('/howto') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faCircleQuestion} />
          <span>How To</span>
        </Link>
      <Link to="https://mytender.io/" className="sidebarsmall-image-link">
          <img src={sidebarIcon} alt="Sidebar Icon" />
          <span>Site</span>
        </Link>
      
      </div>
    </div>
  );
};

export default SideBarSmall;
