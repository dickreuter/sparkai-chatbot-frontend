import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "./DashboardCard.css";
import { useNavigate } from "react-router-dom";

interface DashboardCardProps {
  icon: IconDefinition;
  title: string;
  description: string;
  path: string;
  style?: React.CSSProperties;
  onCardClick?: () => void; // Add this prop
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  description,
  path,
  style,
  onCardClick
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path === "/bid-extractor" && onCardClick) {
      onCardClick(); // Call the provided onCardClick function
    } else {
      navigate(path);
    }
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
