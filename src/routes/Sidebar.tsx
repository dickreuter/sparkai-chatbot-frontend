import React from 'react';
import { Link } from 'react-router-dom';
import "./Sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faFileAlt,  // Icon representing documents or information
  faFileCircleQuestion, // Icon for questions
  faReply, // Icon for comments or responses
  faFileContract // Icon for proposals or contracts
} from '@fortawesome/free-solid-svg-icons';

const SideBar = () => {
  const scrollToTop = (e) => {
    e.preventDefault(); // Prevent the default link behavior
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // for a smooth scrolling
    });
  };

  return (
    <div className="sidebar">
      {/* Use '#' as the 'to' attribute to prevent navigation to a different route */}
      <Link to="#" onClick={scrollToTop} className='sidebarlink'>
        <FontAwesomeIcon icon={faHome} /> Home
      </Link>
      <Link to="/chatbot#bidinfo" className='sidebarlink'><FontAwesomeIcon icon={faFileAlt} /> Bid Info</Link>
      <Link to="/chatbot#inputquestion" className='sidebarlink'><FontAwesomeIcon icon={faFileCircleQuestion} /> Question</Link>
      <Link to="/chatbot#response" className='sidebarlink'><FontAwesomeIcon icon={faReply} /> Response</Link>
      <Link to="/chatbot#proposal" className='sidebarlink'><FontAwesomeIcon icon={faFileContract} /> Proposal</Link>
    </div>
  );
};

export default SideBar;
