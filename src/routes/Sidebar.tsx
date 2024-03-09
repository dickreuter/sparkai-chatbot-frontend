import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import "./Sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const SideBar = () => {
  const [isActiveVisible, setIsActiveVisible] = useState(true);
  const [isOngoingVisible, setIsOngoingVisible] = useState(true);

  const toggleActive = () => setIsActiveVisible(!isActiveVisible);
  const toggleOngoing = () => setIsOngoingVisible(!isOngoingVisible);
  const scrollToTop = (e) => {
    e.preventDefault(); // Prevent the default link behavior
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // for a smooth scrolling
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-top-title" onClick={toggleActive}>
        Active
        <span className="toggle-icon">
          <FontAwesomeIcon icon={isActiveVisible ? faChevronDown : faChevronRight} />
        </span>
      </div>
      {isActiveVisible && (
        <div className="sidebar-links">
          <Link onClick={scrollToTop}  to="/chatbot#bidinfo" className='sidebarlink'>Bid Info</Link>
          <Link to="/chatbot#inputquestion" className='sidebarlink'>Question</Link>
          <Link to="/chatbot#response" className='sidebarlink'>Response</Link>
          <Link to="/chatbot#proposal" className='sidebarlink'>Proposal</Link>
        </div>
      )}
      <div className="sidebar-title" onClick={toggleOngoing}>
        Ongoing
        <span className="toggle-icon">
          <FontAwesomeIcon icon={isOngoingVisible ? faChevronDown : faChevronRight} />
        </span>
      </div>
      {isOngoingVisible && (
        <div className="sidebar-links">
          <Link to="/chatbot#bidinfo" className='sidebarlink'>Bid 1</Link>
          <Link to="/chatbot#inputquestion" className='sidebarlink'>Bid 2</Link>
          <Link to="/chatbot#response" className='sidebarlink'>Bid 3</Link>
        </div>
      )}
    </div>
  );
};

export default SideBar;
