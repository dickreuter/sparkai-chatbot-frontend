import React, { useState, useEffect, useRef } from 'react';
import { useAuthUser } from 'react-auth-kit';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { Link } from 'react-router-dom';
import "./Sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import ReactGA from "react-ga4";


const handleGAEvent = (category, action, label) => {
    ReactGA.event({
      category: category,
      action: action,
      label: label,
    });
  };


const Sidebar = () => {
  const [isActiveVisible, setIsActiveVisible] = useState(true);
  const [isOngoingVisible, setIsOngoingVisible] = useState(true);
  const getAuth = useAuthUser();
  const auth = getAuth();
  const [bids, setBids] = useState([]);
  // Adjust this useRef to obtain the token from your authentication context or state
  const tokenRef = useRef(auth?.token || "default");

  useEffect(() => {
    fetchBids();
  }, []);

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
        console.log(response.data);
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
          <Link onClick={scrollToTop} to="/chatbot#bidinfo" className='sidebar-link'>Bid Info</Link>
          <Link to="/chatbot#inputquestion" className='sidebar-link'>Question</Link>
          <Link to="/chatbot#response" className='sidebar-link'>Response</Link>
          <Link to="/chatbot#proposal" className='sidebar-link'>Proposal</Link>
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
            <Link key={index} to={`/chatbot#${bid.bid_title}`} onClick={scrollToTop} className='sidebar-link'>
              {bid.bid_title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;