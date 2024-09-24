import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import { Button, Col, Row, Card, Modal, FormControl, InputGroup, Form } from "react-bootstrap";
import UploadPDF from './UploadPDF';
import UploadText from './UploadText';
import "./Library.css";
import SideBarSmall from '../routes/SidebarSmall.tsx';
import handleGAEvent from "../utilities/handleGAEvent.tsx";
import { faEye, faTrash, faFolder, faFileAlt, faArrowUpFromBracket, faEllipsisVertical, faSearch, faQuestionCircle, faPlus, faArrowLeft, faReply, faTimes, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import "./Chatbot.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UploadPDFModal, UploadTextModal, UploadButtonWithDropdown } from "./UploadButtonWithDropdown.tsx";
import { Menu, MenuItem, IconButton } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import FileContentModal from "../components/FileContentModal.tsx";
import { displayAlert } from "../helper/Alert.tsx";
import LibraryWizard from "../wizards/LibraryWizard.tsx"; // Adjust the import path as needed


const SelectFolder = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [availableCollections, setAvailableCollections] = useState([]);
  const [folderContents, setFolderContents] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [activeFolder, setActiveFolder] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElFile, setAnchorElFile] = useState(null);

  const [currentFile, setCurrentFile] = useState(null);

  const open = Boolean(anchorEl);
  const [searchQuery, setSearchQuery] = useState('');
  

  const [folderStructure, setFolderStructure] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});

  const [showPdfViewerModal, setShowPdfViewerModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const searchBarRef = useRef(null);

  const [updateTrigger, setUpdateTrigger] = useState(0);

  const getTopLevelFolders = () => {
    return availableCollections.filter(collection => 
      !collection.includes('FORWARDSLASH') && !collection.startsWith('TenderLibrary_')
    );
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  

  const handleClick = (event, file) => {
    setAnchorElFile(event.currentTarget);
    setCurrentFile(file);
  };

  const handleClose = () => {
    setAnchorElFile(null);
  };

  


  const fetchFolderStructure = async () => {
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_collections`,
        {},
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
  
      //console.log(response.data);
      setAvailableCollections(response.data.collections);
      console.log(response.data.collections);
      const structure = {};
      response.data.collections.forEach(collectionName => {
        const parts = collectionName.split('FORWARDSLASH');
        let currentLevel = structure;
        parts.forEach((part, index) => {
          if (!currentLevel[part]) {
            currentLevel[part] = index === parts.length - 1 ? null : {};
          }
          currentLevel = currentLevel[part];
        });
      });
  
      setFolderStructure(structure);
    } catch (error) {
      console.error("Error fetching folder structure:", error);
    }
  };
  const fetchFolderContents = async (folderPath) => {
    try {
      
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_folder_filenames`,
        { collection_name: folderPath },
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
  
      const filesWithIds = response.data.map(item => ({
        filename: item.meta,
        unique_id: item.unique_id,
        isFolder: false
      }));
  
   
      // Get subfolders
      const subfolders = availableCollections
        .filter(collection => collection.startsWith(folderPath + 'FORWARDSLASH'))
        .map(collection => {
          const parts = collection.split('FORWARDSLASH');
          return {
            filename: parts[parts.length - 1],
            unique_id: collection,
            isFolder: true
          };
        });
  
      
  
      const allContents = [...subfolders, ...filesWithIds];
     
  
      setFolderContents(prevContents => ({
        ...prevContents,
        [folderPath]: allContents
      }));
    } catch (error) {
      console.error("Error fetching folder contents:", error);
    }
  };

  const handleFolderClick = (folderPath) => {
    console.log(`Folder clicked: ${folderPath}`);
    setActiveFolder(folderPath);
    if (!folderContents[folderPath]) {
      console.log(`Fetching contents for ${folderPath} as they don't exist yet`);
      fetchFolderContents(folderPath);
    } else {
      console.log(`Contents for ${folderPath} already exist:`, folderContents[folderPath]);
    }
  };

const handleBackClick = () => {
  if (activeFolder) {
    const parts = activeFolder.split('FORWARDSLASH');
    if (parts.length > 1) {
      // Go up one level
      const parentFolder = parts.slice(0, -1).join('FORWARDSLASH');
      setActiveFolder(parentFolder);
      if (!folderContents[parentFolder]) {
        fetchFolderContents(parentFolder);
      }
    } else {
      // If we're at the root level, go back to the main folder view
      setActiveFolder(null);
    }
  }
};
useEffect(() => {
  fetchFolderStructure();
  if (activeFolder) {
    fetchFolderContents(activeFolder);
  }
}, [updateTrigger, activeFolder]);

  useEffect(() => {
    setShowDropdown(searchQuery.length > 0);
  }, [searchQuery]);
  

  useEffect(() => {
    if (activeFolder === null) {
      const topLevelFolders = getTopLevelFolders();
      const itemsCount = topLevelFolders.length;
      const pages = Math.ceil(itemsCount / rowsPerPage);
      setTotalPages(pages);
      setCurrentPage(1);
    } else {
      const itemsCount = folderContents[activeFolder]?.length || 0;
      const pages = Math.ceil(itemsCount / rowsPerPage);
      setTotalPages(pages);
      setCurrentPage(1); // Reset to first page when changing folders
    }
  }, [activeFolder, folderContents, availableCollections, rowsPerPage]);
  
  const formatDisplayName = (name) => {
    return name.replace(/_/g, ' ');
  };

  const renderFolderStructure = (structure, path = '') => {
    const topLevelFolders = getTopLevelFolders();
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const foldersToRender = topLevelFolders.slice(startIndex, endIndex);
  
    return foldersToRender.map((folderName) => {
      const displayName = formatDisplayName(folderName);
      return (
        <tr key={folderName} onClick={() => handleFolderClick(folderName)} style={{ cursor: 'pointer' }}>
          <td>
            <FontAwesomeIcon 
              icon={faFolder} 
              className="fa-icon"
              style={{ marginRight: '10px' }}
            />
            {displayName}
          </td>
          <td colSpan={3}>
            <UploadButtonWithDropdown
              folder={folderName}
              get_collections={fetchFolderStructure}
              handleShowPDFModal={handleShowPDFModal}
              handleShowTextModal={handleShowTextModal}
              setShowDeleteFolderModal={setShowDeleteFolderModal}
              setFolderToDelete={setFolderToDelete}
            />
          </td>
        </tr>
      );
    });
  };

  
const renderFolderContents = (folderPath) => {
  const contents = folderContents[folderPath] || [];
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const contentsToRender = contents.slice(startIndex, endIndex);

  return contentsToRender.map(({ filename, unique_id, isFolder }, index) => {
    const fullPath = isFolder ? `${folderPath}FORWARDSLASH${filename}` : folderPath;
    const displayName = formatDisplayName(filename);
    return (
      <tr key={`${folderPath}-${index}`} style={{ cursor: 'pointer' }}>
          <td onClick={() => isFolder ? handleFolderClick(fullPath) : viewFile(filename, folderPath, unique_id)}>
            <FontAwesomeIcon 
              icon={isFolder ? faFolder : faFileAlt} 
              className="fa-icon" 
              style={{ marginRight: '10px' }} 
            />
            {displayName}
          </td>
          <td colSpan={3}>
            {isFolder ? (
              <UploadButtonWithDropdown
                folder={fullPath}
                get_collections={fetchFolderStructure}
                handleShowPDFModal={handleShowPDFModal}
                handleShowTextModal={handleShowTextModal}
                setShowDeleteFolderModal={setShowDeleteFolderModal}
                setFolderToDelete={setFolderToDelete}
              />
            ) : (
              <div>
                <Button
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  onClick={(event) => handleClick(event, { filename, unique_id })}
                  sx={{
                    borderRadius: '50%',
                    minWidth: 0,
                    padding: '10px',
                    backgroundColor: 'transparent',
                    '&.MuiButton-root:active': {
                      boxShadow: 'none',
                    },
                  }}
                  className="ellipsis-button"
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} className="ellipsis-icon" />
                </Button>
                <Menu
                  id="simple-menu"
                  anchorEl={anchorElFile}
                  keepMounted
                  open={Boolean(anchorElFile)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleDeleteClick} style={{ fontFamily: '"ClashDisplay", sans-serif' }}>
                    <i className="fas fa-trash-alt" style={{ marginRight: '12px' }}></i>
                    Delete File
                  </MenuItem>
                </Menu>
              </div>
            )}
          </td>
        </tr>
      );
    });
  };



    return (
     
      
          <Card className="library-card-custom">
            <Card.Body className="library-card-body-content">
              <div className="library-card-content-wrapper">
                <div className="header-row mt-2">
                  <div className="lib-title" id='library-table' style={{marginLeft: "15px"}}>Select Folder</div>
                
                <table className="library-table">
                  <thead>
                    <tr>
                      <th>
                        {renderBreadcrumbs()}
                      </th>
                      <th colSpan={3}>
                        {activeFolder && (
                          <div 
                            className="back-button" 
                            onClick={() => handleBackClick()} 
                            style={{ cursor: 'pointer', padding: '5px'}}
                          >
                            <FontAwesomeIcon icon={faReply} />
                            <span style={{ marginLeft: "10px"}}>Back</span>
                          </div>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFolder 
                      ? renderFolderContents(activeFolder)
                      : renderFolderStructure(folderStructure)
                    }
                  </tbody>
                </table>
              </div>
  
              <div className="pagination-controls">
                {totalPages > 1 && [...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => paginate(i + 1)} disabled={currentPage === i + 1} className="pagination-button">
                    {i + 1}
                  </button>
                ))}
              </div>
              </div>
            </Card.Body>
          </Card>
    );
  }
  
  export default withAuth(SelectFolder);
