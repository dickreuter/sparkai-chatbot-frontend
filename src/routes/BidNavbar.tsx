import React from 'react';
import { NavLink } from 'react-router-dom';
import './BidNavbar.css'; // Your CSS styles

const BidNavbar = () => {
  return (
    <div className="bidnav">
      <div className="bidnav-section">
        <NavLink to="/bid-extractor" className="bidnav-item" activeClassName="active">Bid Extractor</NavLink>
        <NavLink to="/question-crafter" className="bidnav-item" activeClassName="active">Question Crafter</NavLink>
        <NavLink to="/proposal" className="bidnav-item" activeClassName="active">Proposal</NavLink>
      </div>
    </div>
  );
};

export default BidNavbar;
