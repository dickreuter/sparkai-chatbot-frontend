import React, { useContext } from "react";
import { NavLink } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { BidContext } from "../views/BidWritingStateManagerView";
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import "./BidNavbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const BidNavbar = () => {
  const { sharedState } = useContext(BidContext);
  const { isLoading, saveSuccess } = sharedState;

  return (
    <div className="bidnav">
      <div className="bidnav-section">
        <NavLink to="/bid-extractor" className="bidnav-item" activeClassName="active">Bid Planner</NavLink>
        <NavLink to="/question-crafter" className="bidnav-item" activeClassName="active">Q&A Generator </NavLink>
        <NavLink to="/proposal" className="bidnav-item" activeClassName="active">Bid Complier</NavLink>
        <div className="status-indicator mt-2">
          {isLoading ? (
            <Spinner animation="border" size="lg" style={{ width: '1.4rem', height: '1.4rem' }} />
          ) : saveSuccess === true ? (
            <FontAwesomeIcon
              icon={faCheckCircle}
              style={{ color: 'green', fontSize: '1.4rem' }}
              title="Draft saved"
            />
          ) : saveSuccess === false ? (
            <FontAwesomeIcon
              icon={faTimesCircle}
              style={{ color: 'red', fontSize: '1.4rem' }}
              title="Failed to save"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BidNavbar;
