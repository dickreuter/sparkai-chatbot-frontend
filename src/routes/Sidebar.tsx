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

const SideBar = ({ isCopilotVisible, setIsCopilotVisible, selectedText, askCopilot }) => {

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


  
  const handleLinkClick = (linkName) => (e) => {
    e.preventDefault(); // Prevent the default link behavior
    console.log(`${linkName} clicked`);
    const copilot_mode = linkName.toLowerCase().replace(/\s+/g, '_');
    console.log(`${copilot_mode}`);
    const instructions = '';
    console.log(selectedText);
    askCopilot(selectedText, instructions, copilot_mode ); 

    // Here you can add any logic you need to handle the click
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

      <div>
          <div className="sidebar-title" onClick={() => setIsCopilotVisible(false)}>
            Copilot
            <span className="toggle-icon">
              <FontAwesomeIcon icon={isCopilotVisible ? faChevronDown : faChevronRight} />
            </span>
          </div>

            {isCopilotVisible && (

                <div className="sidebar-links smaller-links">
                <a href="#" onClick={handleLinkClick('Expand')} className='sidebar-link'>Expand</a>
                <a href="#" onClick={handleLinkClick('Summarise')} className='sidebar-link'>Summarise</a>
                <a href="#" onClick={handleLinkClick('Improve Grammar')} className='sidebar-link'>Improve Grammar</a>
                <a href="#" onClick={handleLinkClick('Translate to English')} className='sidebar-link'>Translate to English</a>
                <a href="#" onClick={handleLinkClick('Change Tense')} className='sidebar-link'>Change Tense</a>
                <a href="#" onClick={handleLinkClick('Rephrase')} className='sidebar-link'>Rephrase</a>
                <a href="#" onClick={handleLinkClick('Incorporate')} className='sidebar-link'>Incorporate</a>
                <a href="#" onClick={handleLinkClick('We Will Active Voice')} className='sidebar-link'>We Will Active Voice</a>
                <a href="#" onClick={handleLinkClick('List Creator')} className='sidebar-link'>List Creator</a>
                <a href="#" onClick={handleLinkClick('Reduce Word Character Count')} className='sidebar-link'>Reduce Word Character Count</a>
                <a href="#" onClick={handleLinkClick('Word Cutting Adverbs')} className='sidebar-link'>Word Cutting Adverbs</a>
                <a href="#" onClick={handleLinkClick('Word Cutting Adjectives')} className='sidebar-link'>Word Cutting Adjectives</a>
                <a href="#" onClick={handleLinkClick('Word Cutting Commas with Dashes')} className='sidebar-link'>Word Cutting Commas with Dashes</a>
                <a href="#" onClick={handleLinkClick('Explain How')} className='sidebar-link'>Explain How</a>
                <a href="#" onClick={handleLinkClick('Add Statistics')} className='sidebar-link'>Add Statistics</a>
                <a href="#" onClick={handleLinkClick('For Example')} className='sidebar-link'>For Example</a>
                <a href="#" onClick={handleLinkClick('Adding Case Study')} className='sidebar-link'>Adding Case Study</a>
                <a href="#" onClick={handleLinkClick('Search Company Library')} className='sidebar-link'>Search Company Library</a>
                </div>
                
            )}
      
        </div>

  </div>
  );




};

export default SideBar;
