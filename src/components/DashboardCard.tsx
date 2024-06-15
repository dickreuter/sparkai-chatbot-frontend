import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import './DashboardCard.css';
import { useNavigate } from 'react-router-dom';

interface DashboardCardProps {
  icon: IconDefinition;
  title: string;
  description: string;
  path: string; // Change prop name to 'path'
  style?: React.CSSProperties;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, path, style }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path === '/bid-extractor') {
      // Add your custom logic here
      localStorage.removeItem('bidInfo');
      localStorage.removeItem('backgroundInfo');
      localStorage.removeItem('response');
      localStorage.removeItem('inputText');
      localStorage.removeItem('editorState');
      console.log('Bid Extractor path clicked!');
      // You can add any additional logic here before navigating
    }
    navigate(path);
  };

  return (
    <div className="dashboard-card" style={style} onClick={handleClick}>
      <div className="card-effect">
        <div className="round_iconbox">
          <FontAwesomeIcon icon={icon} />
        </div>
        <h5 className="mt-4 mb-2">{title}</h5>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
