import React from 'react';
import { Link } from 'react-router-dom';
import "./Sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCode, faGavel, faComments } from '@fortawesome/free-solid-svg-icons';


const SideBar = () => {
  return (
    <div className="sidebar">
      <Link to="/library" className='sidebarlink'><FontAwesomeIcon icon={faHome} /> Home</Link>
      <Link to="/chatbot" className='sidebarlink'><FontAwesomeIcon icon={faCode} /> Chatbot</Link>
      <Link to="/bids" className='sidebarlink'><FontAwesomeIcon icon={faGavel} /> Bids</Link>
      <Link to="/feedback" className='sidebarlink'><FontAwesomeIcon icon={faComments} /> Feedback</Link>
    </div>
  );
};

export default SideBar;
