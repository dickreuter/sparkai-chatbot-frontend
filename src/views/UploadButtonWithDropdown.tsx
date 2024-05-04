import React, {useEffect, useRef, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Modal } from "react-bootstrap";
import { MenuItem, Menu } from "@mui/material";
import { faArrowUpFromBracket, faEllipsisVertical} from '@fortawesome/free-solid-svg-icons';
import UploadPDF from './UploadPDF';
import UploadText from './UploadText';



// Modals for PDF and Text Upload


const UploadButtonWithDropdown = ({
    folder, get_collections, handleShowPDFModal, handleShowTextModal,
    setShowDeleteFolderModal, setFolderToDelete
}) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        event.stopPropagation();  // This prevents the event from bubbling up to the table row
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };

    // Ensure that these functions also stop propagation
    const handlePDFClick = (event) => {
        event.stopPropagation();
        handleShowPDFModal(event, folder);
        handleClose();
    };

    const handleTextClick = (event) => {
        event.stopPropagation();
        handleShowTextModal(event, folder);
        handleClose();
    };

    const handleDeleteClick = (event) => {
        event.stopPropagation();
        setFolderToDelete(folder);
        setShowDeleteFolderModal(true);
        handleClose();
    };

    return (
        <>
           <Button
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handleClick}
                className="ellipsis-button"  // Apply the new class for styling
            >
                <FontAwesomeIcon icon={faEllipsisVertical} className="ellipsis-icon" />
            </Button>

            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                 <MenuItem onClick={handlePDFClick} style={{ fontFamily: '"ClashDisplay", sans-serif' }}>Upload PDF</MenuItem>
                    <MenuItem onClick={handleTextClick} style={{ fontFamily: '"ClashDisplay", sans-serif' }}>Upload Text</MenuItem>
                    <MenuItem onClick={handleDeleteClick} style={{ fontFamily: '"ClashDisplay", sans-serif' }}>Delete Folder</MenuItem>
            </Menu>
        </>
    );
};

export { UploadButtonWithDropdown };