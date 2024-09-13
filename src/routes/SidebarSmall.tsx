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
  faCircleQuestion,
  faUser,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';
// Import the image
import sidebarIcon from '../resources/images/mytender.io_badge.png';

const SideBarSmall = () => {
  const location = useLocation(); // Hook to get the current location

  // Function to determine if the link is active based on the current path
  const isActive = (path) => location.pathname === path;
  const signOut = useSignOut();


  const handleShowTips = () => {
    localStorage.setItem('dashboardTourCompleted', 'false');
    localStorage.setItem('bidCompilerTourCompleted', 'false');
    localStorage.setItem('bidExtractorTourCompleted', 'false');
    localStorage.setItem('libraryTourCompleted', 'false');
    localStorage.setItem('questionCrafterTourCompleted', 'false');
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new Event('showTips'));
  };

  
  return (
    <div className="sidebarsmall">
      <div>

        <Link to="/bids" className={`sidebarsmalllink ${isActive('/bids') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faLayerGroup} />
          <span id="bids-table">Dashboard</span>
        </Link>
        <Link to="/library" className={`sidebarsmalllink ${isActive('/library') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faBookOpen} />
          <span id='library-title'>Content Library</span>
        </Link>
        <Link to="/chatResponse" className={`sidebarsmalllink ${isActive('/chatResponse') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faComments} />
          <span>Quick Question</span>
        </Link>
        <Link to="/howto" className={`sidebarsmalllink ${isActive('/howto') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faCircleQuestion} />
          <span >How To Guide</span>
        </Link>
      </div>
      <div className="signout-container">
     
        <Link to="/profile" className={`sidebarsmalllink ${isActive('/profile') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faUser} />
          <span>Profile</span>
        </Link>
        <Link to="#" className="sidebarsmalllink" onClick={handleShowTips} id='showtips'>
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>Show Tips</span>
        </Link>
        <Link to="/logout" className={`sidebarsmalllink ${isActive('/logout') ? 'sidebarsmalllink-active' : ''}`}>
          <FontAwesomeIcon icon={faReply} />
          <span>Logout</span>
        </Link>

        
      
      </div>
    </div>
  );
};

export default SideBarSmall;
