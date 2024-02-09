import React from 'react';
import { Link } from 'react-router-dom';
import "./SideBar.css";

const SideBar = () => {
  return (
    <div className="sidebar">
      <Link to="/">Home</Link>
      <Link to="/bid1">Bid 1</Link>
      <Link to="/bid2">Bid 2</Link>
      // Add additional links as necessary
    </div>
  );
};

export default SideBar;
