import React, { useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import { Button, Col, Row, Card, Modal, FormControl, InputGroup } from "react-bootstrap";
import UploadPDF from './UploadPDF';
import UploadText from './UploadText';
import "./Library.css";
import SideBarSmall from '../routes/SidebarSmall.tsx';
import handleGAEvent from "../utilities/handleGAEvent.tsx";
import { faEye, faTrash, faFolder, faFileAlt, faArrowUpFromBracket, faEllipsisVertical, faSearch, faQuestionCircle, faPlus, faArrowLeft, faReply } from '@fortawesome/free-solid-svg-icons';
import "./Chatbot.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UploadPDFModal, UploadTextModal, UploadButtonWithDropdown } from "./UploadButtonWithDropdown.tsx";
import { Menu, MenuItem, IconButton } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import FileContentModal from "../components/FileContentModal.tsx";
import { displayAlert } from "../helper/Alert.tsx";

const Library = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [availableCollections, setAvailableCollections] = useState([]);
  const [folderContents, setFolderContents] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 9;
  const [totalPages, setTotalPages] = useState(0);
  const [activeFolder, setActiveFolder] = useState(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState('');
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [uploadFolder, setUploadFolder] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);


  const [showPdfViewerModal, setShowPdfViewerModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const searchBarRef = useRef(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  

  const handleMenuItemClick = (action) => {
    handleMenuClose();
    if (action === 'pdf') handleOpenPDFModal();
    else if (action === 'text') handleOpenTextModal();
  };

  const handleDelete = async (folderTitle) => {
    console.log('Deleting folder:', folderTitle);
    setFolderToDelete(''); 
    deleteFolder(folderTitle);
    setShowDeleteFolderModal(false);
  };

  const handleDeleteFileClick = (event, unique_id, filename) => {
    event.stopPropagation(); 
    setFileToDelete({ unique_id, filename });
    setShowDeleteFileModal(true);
  };

  const handleShowPDFModal = (event, folder) => {
    event.stopPropagation();
    setUploadFolder(folder);  
    setShowPDFModal(true);
  };

  const handleShowTextModal = (event, folder) => {
    event.stopPropagation();
    setUploadFolder(folder);
    setShowTextModal(true);
  };

  const handleOpenPDFModal = () => {
    setUploadFolder(null);
    setShowPDFModal(true);
  };

  const handleOpenTextModal = () => {
    setUploadFolder(null);
    setShowTextModal(true);
  };

  const modalRef = useRef();
  const closeModal = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShowPdfViewerModal(false);
      setShowModal(true); // Close the modal after saving
    }
  };

  const UploadPDFModal = ({ show, onHide, folder, get_collections }) => (
    <Modal 
        show={show} 
        onHide={() => { onHide(); }}
        onClick={(e) => e.stopPropagation()}
        size="lg"
    >
        <Modal.Header closeButton onClick={(e) => e.stopPropagation()}>
            <Modal.Title>PDF Uploader</Modal.Title>
        </Modal.Header>
        <Modal.Body onClick={(e) => e.stopPropagation()}>
            <UploadPDF folder={folder} get_collections={get_collections} onClose={onHide} />
        </Modal.Body>
    </Modal>
  );

  const UploadTextModal = ({ show, onHide, folder, get_collections}) => (
    <Modal
      show={show}
      onHide={() => { onHide(); }}
      onClick={(e) => e.stopPropagation()}
      size="lg"
    >
      <Modal.Header closeButton onClick={(e) => e.stopPropagation()}>
        <Modal.Title>Text Uploader</Modal.Title>
      </Modal.Header>
      <Modal.Body onClick={(e) => e.stopPropagation()}>
        <UploadText 
          folder={folder} 
          get_collections={get_collections} 
          onClose={onHide}
          
        />
      </Modal.Body>
    </Modal>
  );
  
  const DeleteFolderModal = ({ show, onHide, onDelete, folderTitle }) => (
    <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
            <Modal.Title>Delete Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            Are you sure you want to delete the folder "{folderTitle}"?
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
                Cancel
            </Button>
            <Button variant="danger" onClick={() => onDelete(folderTitle)}>
                Delete
            </Button>
        </Modal.Footer>
    </Modal>
  );

  const DeleteFileModal = ({ show, onHide, onDelete, fileName }) => (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Delete File</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete the file "{fileName}"?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => onDelete()}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );


  const fetchFolderFilenames = async (folderName) => {
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_folder_filenames`,
        { collection_name: folderName },
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
      

      const filesWithIds = response.data.map(item => ({
        filename: item.meta,
        unique_id: item.unique_id
      }));

      setFolderContents(prevContents => ({
        ...prevContents,
        [folderName]: filesWithIds
      }));
    } catch (error) {
      console.error("Error fetching folder filenames:", error);
    }
  };

  const get_collections = async () => {
    try {
      const res = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_collections`,
        {},
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
      setAvailableCollections(res.data.collections || []);
      for (const collection of res.data.collections || []) {
        await fetchFolderFilenames(collection);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const saveFileContent = async (id, newContent, folderName) => {
    try {
      const formData = new FormData();
      formData.append('id', id); // Make sure this matches your FastAPI endpoint's expected field
      formData.append('text', newContent);
      formData.append('profile_name', folderName);
      formData.append('mode', 'plain');
  
      console.log(formData);
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/updatetext`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`
          },
        }
      );
  
      setModalContent(newContent); // Update the modal content with the new content
      
      console.log('Content updated successfully');
    } catch (error) {
      console.error('Error saving file content:', error);
    }
  };
  
  

  const viewFile = async (fileName, folderName, unique_id) => {
    const formData = new FormData();
    formData.append('file_name', fileName);
    formData.append("profile_name", folderName);
  
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/show_file_content`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`
          },
        }
      );
  
      setModalContent(response.data);
      setCurrentFileId(unique_id); // Set the current file ID
      setCurrentFileName(fileName); // Set the current file name
      setShowModal(true);
    } catch (error) {
      console.error('Error viewing file:', error);
    }
  };
  
  
  
  const viewPdfFile = async (fileName, folderName) => {
    const formData = new FormData();
    formData.append('file_name', fileName);
    formData.append('profile_name', folderName);

    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/show_file_content_pdf_format`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
          },
          responseType: 'blob', // Important to get the response as a blob
        }
      );

      // Create a URL for the PDF file
      const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPdfUrl(fileURL);
      setShowPdfViewerModal(true);

    } catch (error) {
      console.error('Error viewing PDF file:', error);

      if (error.response && error.response.status === 404) {
        // Try using the viewFile function if the file was not found as a PDF
        displayAlert('PDF file not found, try reuploading the pdf file', "danger");
        
      }
    }
  };
  const deleteDocument = async (uniqueId) => {
    const formData = new FormData();
    formData.append('unique_id', uniqueId);

    try {
        await axios.post(
            `http${HTTP_PREFIX}://${API_URL}/delete_template_entry/`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${tokenRef.current}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        handleGAEvent('Library', 'Delete Document', 'Delete Document Button');
        get_collections();
    } catch (error) {
        console.error("Error deleting document:", error);
    }
  };

  const deleteFolder = async (folderTitle) => {
    const formData = new FormData();
    formData.append('profile_name', folderTitle);

    try {
        await axios.post(
            `http${HTTP_PREFIX}://${API_URL}/delete_template/`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${tokenRef.current}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        handleGAEvent('Library', 'Delete Folder', 'Delete Folder Button');
        get_collections();
    } catch (error) {
        console.error("Error deleting document:", error);
    }
  };

  const handleFolderClick = (folderName) => {
    setActiveFolder(folderName);
    setCurrentPage(1);
  };

  useEffect(() => {
    get_collections();
  }, []);

  useEffect(() => {
    setShowDropdown(searchQuery.length > 0);
  }, [searchQuery]);
  

  useEffect(() => {
    if (activeFolder === null) {
      setCurrentPage(1);
    }
    const itemsCount = activeFolder ? (folderContents[activeFolder]?.length || 0) : availableCollections.length;
    const pages = Math.ceil(itemsCount / rowsPerPage);
    setTotalPages(pages);
  }, [activeFolder, folderContents, availableCollections.length, rowsPerPage]);

  const renderFolders = () => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const foldersToDisplay = availableCollections.slice(startIdx, endIdx);
  
    return foldersToDisplay.map((folder, index) => (
      <tr key={index} onClick={() => handleFolderClick(folder)} style={{ cursor: 'pointer' }}>
        <td>
          <FontAwesomeIcon 
            icon={faFolder} 
            className="fa-icon"  
            onClick={(event) => event.stopPropagation()} 
            style={{ cursor: 'pointer', marginRight: '10px' }} 
          /> 
          {folder.replace(/_/g, ' ')}
        </td>
        <td colSpan={3}>
          <UploadButtonWithDropdown
            folder={folder}
            get_collections={get_collections}
            handleShowPDFModal={handleShowPDFModal}
            handleShowTextModal={handleShowTextModal}
            setShowDeleteFolderModal={setShowDeleteFolderModal}
            setFolderToDelete={setFolderToDelete}
          />
        </td> 
      </tr>
    ));
  };
  
  
  
  const renderFolderContents = () => {
    if (!activeFolder || !folderContents[activeFolder]) return null;
  
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const currentFiles = folderContents[activeFolder]?.slice(start, end) || [];
  
    return currentFiles.map(({ filename, unique_id }, index) => {
      const isPdf = filename.toLowerCase().endsWith('.pdf');
  
      return (
        <tr key={index} style={{ cursor: 'pointer' }}>
          <td onClick={() =>  viewFile(filename, activeFolder, unique_id)}>
            <FontAwesomeIcon icon={faFileAlt} className="fa-icon" /> {filename}
          </td>
          <td colSpan={3}>
            <FontAwesomeIcon
              icon={faTrash}
              className="action-icon delete-icon"
              onClick={(event) => handleDeleteFileClick(event, unique_id, filename)}
              style={{ cursor: 'pointer', marginRight: '15px' }}
            />
          </td>
        </tr>
      );
    });
  };
  
  
  

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  
    if (query.length > 0) {
      const folderMatches = availableCollections.filter(folder => 
        folder.toLowerCase().includes(query.toLowerCase())
      );
  
      const fileMatches = Object.entries(folderContents).flatMap(([folder, files]) =>
        files.filter(file => file.filename.toLowerCase().includes(query.toLowerCase()))
      );
  
      const results = [...folderMatches, ...fileMatches];
      setFilteredResults(results);
      setShowSearchResults(true);  // Show results when there's input
    } else {
      setFilteredResults([]);
      setShowSearchResults(false);  // Hide results when input is cleared
    }
  };
  
  const handleSearchResultClick = async (result) => {
    if (result.filename) {
      // It's a file
      const { filename, unique_id } = result;
      const folder = Object.keys(folderContents).find(folderName => 
        folderContents[folderName].some(file => file.unique_id === unique_id)
      );
  
      if (folder) {
        setActiveFolder(folder);
        setCurrentPage(1);
  
        // Fetch folder contents if not already done
        if (!folderContents[folder] || folderContents[folder].length === 0) {
          await fetchFolderFilenames(folder);
        }
  
  
      }
    } else {
      // It's a folder
      const folderName = result;
      setActiveFolder(folderName);
      setCurrentPage(1);
  
      // Fetch folder contents if not already done
      if (!folderContents[folderName] || folderContents[folderName].length === 0) {
        await fetchFolderFilenames(folderName);
      }
    }
  
    console.log("Search result clicked:", result);
  };
  
  
  const renderSearchResults = () => {
    if (!showSearchResults) return null;
  
    return (
      <div className="search-results-dropdown" >
        {filteredResults.length === 0 ? (
          <div className="search-result-item">
            <FontAwesomeIcon icon={faQuestionCircle} className="result-icon" />
            No results found...
          </div>
        ) : (
          filteredResults.map((result, index) => (
            <div
              key={index}
              className="search-result-item"
              onClick={() => handleSearchResultClick(result)} // Attach listener here
            >
              <FontAwesomeIcon 
                icon={result.filename ? faFileAlt : faFolder} 
                className="result-icon" 
              />
              {result.filename || result}
            </div>
          ))
        )}
      </div>
    );
  };
  
  
 
  

  return (
    <div className="chatpage">
      <SideBarSmall />

      <div className="lib-container">
        <h1 className='heavy'>Content Library</h1>
  
            <Row>
  <Col md={12}>
    <Card className="mb-4 mt-2">
      <Card.Body className="library-card-body-content">
        <div className="library-card-content-wrapper">
          <div className="header-row mt-2">
            <div className="lib-title">Resources</div>

            <InputGroup className={`search-bar-container ${showDropdown ? 'dropdown-visible' : ''}`} ref={searchBarRef} >
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <FormControl
                placeholder="Search folders and files"
                aria-label="Search"
                aria-describedby="basic-addon2"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  setShowDropdown(true);
                  setShowSearchResults(true); // Show results on focus
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setShowDropdown(false);
                    setShowSearchResults(false); // Hide results on blur
                  }, 150);
                }} // Delay to allow click
                className={`search-bar-library ${showDropdown ? 'dropdown-visible' : ''}`}
              />
              {renderSearchResults()}
            </InputGroup>

            <Button
              aria-controls="simple-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
              className="upload-button"
            >
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
              New Folder
            </Button>
            <Menu
              id="long-menu"
              anchorEl={anchorEl}
              keepMounted
              open={open}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleMenuItemClick('pdf')} style={{ fontFamily: '"ClashDisplay", sans-serif', width: "180px" }}>
                <i className="fas fa-file-pdf" style={{ marginRight: '12px' }}></i>
                Upload PDF
              </MenuItem>
              <MenuItem onClick={() => handleMenuItemClick('text')} style={{ fontFamily: '"ClashDisplay", sans-serif' }}>
                <i className="fas fa-file-alt" style={{ marginRight: '12px' }}></i>
                Upload Text
              </MenuItem>
            </Menu>
          </div>

          <table className="library-table">
            <thead>
              <tr>
                <th>{activeFolder ? `Documents in ${activeFolder}` : 'Folders'}</th>
                <th colSpan={3}>
                {activeFolder && (
  <div 
    className="back-to-folders" 
    onClick={() => setActiveFolder(null)} 
    style={{ cursor: 'pointer', padding: '5px'}}
  >
    <FontAwesomeIcon icon={faReply}  />
    <span style={{ marginLeft: "10px"}}>Back to Folders</span>
  </div>
)}
                </th>
              </tr>
            </thead>
            <tbody>
              {activeFolder ? renderFolderContents() : renderFolders()}
            </tbody>
          </table>
        </div>

        <div className="pagination-controls">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => paginate(i + 1)} disabled={currentPage === i + 1} className="pagination-button">
              {i + 1}
            </button>
          ))}
        </div>
      </Card.Body>
    </Card>
  </Col>
</Row>




<FileContentModal
  showModal={showModal}
  setShowModal={setShowModal}
  modalContent={modalContent}
  onSave={(newContent) => saveFileContent(currentFileId, newContent, activeFolder)} // Pass the folder name
  documentId={currentFileId}
  fileName={currentFileName}
  folderName={activeFolder}
  onViewPdf={viewPdfFile} // Pass the viewPdfFile function
/>





        <DeleteFolderModal
          show={showDeleteFolderModal}
          onHide={() => setShowDeleteFolderModal(false)}
          onDelete={() => handleDelete(folderToDelete)}
          folderTitle={folderToDelete}
        />

        <DeleteFileModal
          show={showDeleteFileModal}
          onHide={() => setShowDeleteFileModal(false)}
          onDelete={() => {
            deleteDocument(fileToDelete.unique_id);
            setShowDeleteFileModal(false);
          }}
          fileName={fileToDelete ? fileToDelete.filename : ''}
        />

        <UploadPDFModal
          show={showPDFModal}
          onHide={() => setShowPDFModal(false)}
          folder={uploadFolder}
          get_collections={get_collections}
        />
        <UploadTextModal
          show={showTextModal}
          onHide={() => setShowTextModal(false)}
          folder={uploadFolder}
          get_collections={get_collections}
        />
        <>
    
      {/* Modal Component */}
      {showPdfViewerModal && (
        <div className="pdf-viewer-modal" onClick={closeModal}>
          <div className="pdf-viewer-modal-content" ref={modalRef}>
            <iframe src={pdfUrl} width="100%" height="600px"></iframe>
          </div>
        </div>
      )}
    </>
      </div>
    </div>
  );
}

export default withAuth(Library);
