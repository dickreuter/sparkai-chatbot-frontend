import { Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { Button } from "react-bootstrap";

export interface Section {
  section_id: string;
  heading: string;
  question: string;
  word_count: number;
  reviewer: string;
  choice: string;
  status: "Not Started" | "In Progress" | "Completed";
  weighting?: string;
  page_limit?: string;
}

const StatusMenu = ({
  value,
  onChange
}: {
  value: Section["status"];
  onChange: (value: Section["status"]) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (status: Section["status"]) => {
    onChange(status);
    handleClose();
  };

  const getStatusColor = (status: Section["status"]) => {
    switch (status) {
      case "Completed":
        return "status-complete";
      case "In Progress":
        return "status-in-progress";
      case "Not Started":
        return "status-not-started";
      default:
        return "status-not-started";
    }
  };

  return (
    <div>
      <Button
        onClick={handleClick}
        className={` ${getStatusColor(value)} text-nowrap d-inline-block`}
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        {value}
      </Button>
      <Menu
        id="simple-menu"
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        keepMounted
        PaperProps={{
          elevation: 1, // Reduced elevation for lighter shadow
          style: {
            width: "120px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)" // Custom subtle shadow
          }
        }}
      >
        <MenuItem
          onClick={() => handleSelect("Not Started")}
          className="styled-menu-item"
        >
          Not Started
        </MenuItem>
        <MenuItem
          onClick={() => handleSelect("In Progress")}
          className="styled-menu-item"
        >
          In Progress
        </MenuItem>
        <MenuItem
          onClick={() => handleSelect("Completed")}
          className="styled-menu-item"
        >
          Completed
        </MenuItem>
      </Menu>
    </div>
  );
};

export default StatusMenu;
