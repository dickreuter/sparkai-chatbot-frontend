import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import "./SidebarSmall.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuthUser, useSignOut } from "react-auth-kit";
import {
  faHome,
  faSignOutAlt,
  faBookOpen,
  faLayerGroup,
  faFileAlt,  // Icon representing documents or information
  faFileCircleQuestion, // Icon for questions
  faReply, // Icon for comments or responses
  faFileContract // Icon for proposals or contracts
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
      {/* ...other links... */}

      <Link to="/chatbot" className={`sidebarsmalllink ${isActive('/chatbot') ? 'sidebarsmalllink-active' : ''}`}>
        <FontAwesomeIcon icon={faFileContract} />
      </Link>
      <Link to="/library" className={`sidebarsmalllink ${isActive('/library') ? 'sidebarsmalllink-active' : ''}`}>
        <FontAwesomeIcon icon={faBookOpen} />
      </Link>
      <Link to="/bids" className={`sidebarsmalllink ${isActive('/bids') ? 'sidebarsmalllink-active' : ''}`}>
        <FontAwesomeIcon icon={faLayerGroup} />
      </Link>

      <Link to="/login" onClick={signOut} className="sidebarsmalllink">
        <FontAwesomeIcon icon={faReply} />
      </Link>
      {/* ... */}
      <img src={sidebarIcon} alt="Sidebar Icon" className="sidebarsmall-image" />
    </div>
  );
};

export default SideBarSmall;
