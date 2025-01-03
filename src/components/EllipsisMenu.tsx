import React from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

interface EllipsisMenuProps {
  /**
   * The filename of the current item
   */
  filename: string;

  /**
   * The unique identifier of the current item
   */
  unique_id: string;

  /**
   * Callback function to handle delete action
   */
  onDelete: () => void;
}

const EllipsisMenu: React.FC<EllipsisMenuProps> = ({
  filename,
  unique_id,
  onDelete
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    onDelete();
    handleClose();
  };

  return (
    <div>
      <Button
        aria-controls="simple-menu"
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
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: "120px"
          }
        }}
      >
        <MenuItem onClick={handleDeleteClick} className="styled-menu-item">
          <i className="fas fa-trash-alt styled-menu-item-icon"></i>
          Delete File
        </MenuItem>
      </Menu>
    </div>
  );
};

export default EllipsisMenu;
