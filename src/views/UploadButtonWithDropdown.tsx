import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, MenuItem, Menu } from "@mui/material";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

const UploadButtonWithDropdown = ({
  folder,
  get_collections,
  handleShowPDFModal,
  handleShowTextModal,
  setShowDeleteFolderModal,
  setFolderToDelete
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const dropdownRef = useRef(null);

  const handleClick = (event) => {
    event.stopPropagation(); // This prevents the event from bubbling up to the table row
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  // Ensure that these functions also stop propagation
  const handlePDFClick = (event) => {
    event.stopPropagation();
    handleShowPDFModal(event, folder);
    handleClose(event);
  };

  const handleTextClick = (event) => {
    event.stopPropagation();
    handleShowTextModal(event, folder);
    handleClose(event);
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    setFolderToDelete(folder);
    setShowDeleteFolderModal(true);
    handleClose(event);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleClose(event);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div ref={dropdownRef}>
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
        className="ellipsis-button" // Apply the new class for styling
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
            width: "220px" // Reduced width
          }
        }}
      >
        <MenuItem onClick={handlePDFClick} className="styled-menu-item">
          <i className="fas fa-file-pdf styled-menu-item-icon"></i>
          Upload PDF/Word/Excel
        </MenuItem>
        <MenuItem onClick={handleTextClick} className="styled-menu-item">
          <i className="fas fa-file-alt styled-menu-item-icon"></i>
          Upload Text
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} className="styled-menu-item">
          <i className="fas fa-trash-alt styled-menu-item-icon"></i>
          Delete Folder
        </MenuItem>
      </Menu>
    </div>
  );
};

export { UploadButtonWithDropdown };
