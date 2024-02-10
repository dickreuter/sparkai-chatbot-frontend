import React from 'react';
import { Link } from 'react-router-dom';
import "./Sidebar.css";

const SideBar = () => {
  return (
    <div className="sidebar">
      <Link to="/library">Home</Link>
      <Link to="/chatbot">Chatbot</Link>
      <Link to="/bids">Bids</Link>
      // Add additional links as necessary
    </div>
  );
};

export default SideBar;
