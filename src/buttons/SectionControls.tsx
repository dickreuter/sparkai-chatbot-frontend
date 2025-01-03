import React from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import {
  faArrowUp,
  faArrowDown,
  faTrash
} from "@fortawesome/free-solid-svg-icons";

interface SectionControlsProps {
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SectionControls: React.FC<SectionControlsProps> = ({
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent row click event
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click event
    action();
    handleClose();
  };

  return (
    <div className="d-flex justify-content-center">
      <Button
        ria-controls="simple-menu"
        aria-haspopup="true"
        onClick={handleClick}
        sx={{
          borderRadius: "50%",
          minWidth: 0,
          padding: "10px",
          backgroundColor: "transparent",
          "&.MuiButton-root:active": {
            boxShadow: "none"
          }
        }}
        className="ellipsis-button"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="ellipsis-icon" />
      </Button>
      <Menu
        id="section-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: "160px"
          }
        }}
      >
        {!isFirst && (
          <MenuItem
            onClick={handleAction(onMoveUp)}
            className="styled-menu-item"
          >
            <FontAwesomeIcon icon={faArrowUp} className="me-2" />
            Move Up
          </MenuItem>
        )}
        {!isLast && (
          <MenuItem
            onClick={handleAction(onMoveDown)}
            className="styled-menu-item"
          >
            <FontAwesomeIcon icon={faArrowDown} className="me-2" />
            Move Down
          </MenuItem>
        )}
        <MenuItem onClick={handleAction(onDelete)} className="styled-menu-item">
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
};

export default SectionControls;
