import React, { useState, useEffect, useRef } from 'react';
import { useAuthUser } from 'react-auth-kit';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { Link } from 'react-router-dom';
import "./Sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { useNavigate } from 'react-router-dom';
import handleGAEvent from '../utilities/handleGAEvent';

const Sidebar = () => {
  const [isActiveVisible, setIsActiveVisible] = useState(true);
  const [isOngoingVisible, setIsOngoingVisible] = useState(true);
  const getAuth = useAuthUser();
  const auth = getAuth();
  const [bids, setBids] = useState([]);
  // Adjust this useRef to obtain the token from your authentication context or state
  const tokenRef = useRef(auth?.token || "default");
  const navigate = useNavigate()


 const navigateToChatbot = (bid) => {
  // Tracking the click before navigating
  handleOngoingSidebarLinkClick('Ongoing bid click');

  // Setting item in localStorage
  localStorage.setItem('navigatedFromBidsTable', 'true');

  // Navigating to the chatbot page with state
  navigate('/chatbot', { state: { bid: bid, fromBidsTable: true } });
  fetchBids();
};

  useEffect(() => {
    fetchBids();
  }, []);

  const handleSidebarLinkClick = (anchorId) => {

    handleGAEvent('Sidebar Navigation', 'Link Click', 'sidebar nav');
  };

  const handleOngoingSidebarLinkClick = (label) => {

    handleGAEvent('Sidebar Navigation' , 'Ongoing Link Click', 'ongoing link nav');

  };


  const fetchBids = async () => {
    try {
      const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/get_bids_list/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });
      if (response.data && response.data.bids) {
        setBids(response.data.bids);

      }
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const recentOngoingBids = bids
    .filter(bid => bid.status.toLowerCase() === 'ongoing')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4);

  const toggleActive = () => setIsActiveVisible(!isActiveVisible);
  const toggleOngoing = () => setIsOngoingVisible(!isOngoingVisible);
  const scrollToTop = (e) => {
    e.preventDefault(); // Prevent the default link behavior
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // for a smooth scrolling
    });
  };

  const handleFirstLinkClick = (e, anchorId) => {
    scrollToTop(e); // Pass the event to scrollToTop
    handleSidebarLinkClick(anchorId); // Call handleSidebarLinkClick with the anchorId
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
          {/* You might want to adjust these links based on your app's routing */}
          <Link onClick={(e) => handleFirstLinkClick(e, '#bidinfo')} to="/chatbot#bidinfo" className='sidebar-link'>Bid Info</Link>
          <Link onClick={() => handleSidebarLinkClick('#inputquestion')} to="/chatbot#inputquestion" className='sidebar-link'>Question</Link>
          <Link onClick={() => handleSidebarLinkClick('#response')} to="/chatbot#response" className='sidebar-link'>Response</Link>
          <Link onClick={() => handleSidebarLinkClick('#proposal')} to="/chatbot#proposal" className='sidebar-link'>Proposal</Link>
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
    {recentOngoingBids.map((bid, index) => (
      // Using bid ID or another unique property from bid as the key, if available
      // If bid ID isn't available, fall back to using index, but prefer a more stable identifier if possible
      <Link key={bid.id || index} to="/chatbot" state={{ bid: bid, fromBidsTable: true }} className='sidebar-link' onClick={() => navigateToChatbot(bid)}>
        {bid.bid_title}
      </Link>
    ))}
  </div>
)}

    </div>
  );
};

export default Sidebar;
