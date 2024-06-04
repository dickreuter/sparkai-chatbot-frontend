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
