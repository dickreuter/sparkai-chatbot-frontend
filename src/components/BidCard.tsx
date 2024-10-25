import React from "react";
import { format } from "date-fns";
import LinearProgress from "@mui/material/LinearProgress";
import "./BidCard.css";

const BidCard = ({ title, lastUpdated, completion }) => {
  const formattedDate = format(new Date(lastUpdated), "dd MMM yyyy HH:mm:ss");

  return (
    <div className="bid-card">
      <div className="bid-card-content">
        <div className="completion-wrapper">
          <h5>{title}</h5>
        </div>
        <p className="last-updated">Last Updated: {formattedDate}</p>
      </div>
    </div>
  );
};

export default BidCard;
