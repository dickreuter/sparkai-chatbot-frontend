import React, {useEffect, useRef, useState} from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import {Button, Col,  Row, Card, Modal} from "react-bootstrap";
import UploadPDF from './UploadPDF';
import UploadText from './UploadText';
import "./Library.css";
import SideBarSmall from '../routes/SidebarSmall.tsx' ;
import handleGAEvent from "../utilities/handleGAEvent.tsx";
import { faEye, faTrash, faFolder, faFileAlt } from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Library = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");


  const [availableCollections, setAvailableCollections] = useState([]);
  const [folderContents, setFolderContents] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);



const [totalPages, setTotalPages] = useState(0);

const [showUploadPdfModal, setShowUploadPdfModal] = useState(false);

const [showUploadTextModal, setShowUploadTextModal] = useState(false);

const [activeFolder, setActiveFolder] = useState(null);



// Modal Component for UploadPDF
const UploadPdfModal = () => (
  <Modal show={showUploadPdfModal} onHide={() => setShowUploadPdfModal(false)} size="lg">
       <Modal.Header closeButton >
    <div >
      <Modal.Title >
        PDF Uploader
      </Modal.Title>
    </div>
  </Modal.Header>
    <Modal.Body>
      <div >
        <UploadPDF get_collections={get_collections} />
      </div>
    </Modal.Body>
  </Modal>
);

const UploadTextModal = () => (
  <Modal show={showUploadTextModal} onHide={() => setShowUploadTextModal(false)} size="lg">
     <Modal.Header closeButton >
    <div >
      <Modal.Title >
        Text Uploader
      </Modal.Title>
    </div>
  </Modal.Header>
    <Modal.Body>
      <div >
      <UploadText 
                get_collections = {get_collections}
                />
      </div>
    </Modal.Body>
  </Modal>
);


// Modal component to display file content
const FileContentModal = () => (
  <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
    <Modal.Header closeButton style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
      {/* Wrapping the Modal.Title in a div that takes up full width */}
      <div style={{ flex: '1 1 auto' }}>
        <Modal.Title style={{ textAlign: 'center' }}>
          File Content
        </Modal.Title>
      </div>
    </Modal.Header>
    <Modal.Body style={{
      height: '600px', // Set a fixed height for the modal body
      overflowY: 'auto' // Add vertical scrollbar when content overflows
    }}>
      <pre style={{
        textAlign: 'center',
        padding: '20px', // Add padding around the text
        whiteSpace: 'pre-wrap', // Ensures that text wraps and does not cause horizontal scrolling
        wordWrap: 'break-word', // Break words to prevent overflow
        overflowX: 'hidden' // Hide horizontal scrollbar
      }}>
        {modalContent}
      </pre>
    </Modal.Body>
  </Modal>
);



const fetchFolderFilenames = async (folderName) => {
  try {
    const response = await axios.post(
      `http${HTTP_PREFIX}://${API_URL}/get_folder_filenames`,
      { collection_name: folderName },
      { headers: { Authorization: `Bearer ${tokenRef.current}` } }
    );

    // Assuming response.data is an array of objects with 'meta' and 'unique_id' properties
    console.log(response.data);

    // Create an array of objects, each containing both the filename and unique_id
    const filesWithIds = response.data.map(item => ({
      filename: item.meta,
      unique_id: item.unique_id
    }));

    console.log(filesWithIds);

    // Update folderContents with the new array of objects
    setFolderContents(prevContents => ({
      ...prevContents,
      [folderName]: filesWithIds
    }));
    
  } catch (error) {
    console.error("Error fetching folder filenames:", error);
  }
};



  const viewFile = async (fileName, folderName) => {

    const formData = new FormData();
    formData.append('file_name', fileName);
    formData.append("profile_name", folderName);
    //console.log(folderName);
    //console.log(fileName);
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/show_file_content`,
        formData,
        {
            headers: {
                'Authorization': `Bearer ${tokenRef.current}`
               // This might be needed depending on your backend setup
            },
        }
      );
      // Update modal content and show modal
      //console.log(response.data);
      setModalContent(response.data); // Assume response.data is the content you want to display
      setShowModal(true);
      handleGAEvent('Library', 'View', 'View Button');
    } catch (error) {
      console.error('Error viewing file:', error);
    }
  };

  const get_collections = async () => {
    try {
      const res = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_collections`,
        {},
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
      //console.log("response");
      //console.log(res.data);
      setAvailableCollections(res.data.collections || []);
      // Immediately fetch filenames for all collections
      for (const collection of res.data.collections || []) {
        await fetchFolderFilenames(collection);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

useEffect(() => {
  
  get_collections();
}, []); // Removed tokenRef from dependencies to avoid refetching on token change



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
      console.log("deleted")
      get_collections();
  } catch (error) {
      console.error("Error deleting document:", error);
  }
};

const deleteFolder = async (folderTitle) => {
  console.log("delete folder")
  console.log(folderTitle);
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

      //get_collections(); // Refetch bids after successful deletion
      handleGAEvent('Library', 'Delete Folder', 'Delete Folder Button');
      get_collections();
  } catch (error) {
      console.error("Error deleting document:", error);
  }
};


const handleFolderClick = (folderName) => {
  setActiveFolder(folderName);
  setCurrentPage(1); // Reset pagination to the first page
};

useEffect(() => {
  // Calculate total pages based on whether a folder is selected or not
  const itemsCount = activeFolder ? (folderContents[activeFolder]?.length || 0) : availableCollections.length;
  const pages = Math.ceil(itemsCount / rowsPerPage);
  setTotalPages(pages);
  setCurrentPage(1); // Optionally reset to page 1 when switching context
}, [activeFolder, folderContents, availableCollections.length, rowsPerPage]);


// Function to render folders
const renderFolders = () => {
  // Calculate the slice of folders to display based on current page
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const foldersToDisplay = availableCollections.slice(startIdx, endIdx);

  return foldersToDisplay.map((folder, index) => (
    <tr key={index} onClick={() => handleFolderClick(folder)} style={{ cursor: 'pointer' }}>
      <td><FontAwesomeIcon icon={faFolder} className="fa-icon" /> {folder}</td>
      <td colSpan={3}>
          <FontAwesomeIcon
          icon={faEye}
          className="action-icon view-icon"
          style={{ cursor: 'pointer', marginRight: '15px' }} // Inline styles for cursor and spacing
        />
        <FontAwesomeIcon
          icon={faTrash}
          className="action-icon delete-icon"
          onClick={(event) => {
            event.stopPropagation(); // Prevents the row click event
            deleteFolder(folder);
          }}
          style={{ cursor: 'pointer', marginRight: '15px'}} // Inline style for cursor
        />
        </td> 
    </tr>
  ));
};



const renderFolderContents = () => {
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const currentFiles = folderContents[activeFolder]?.slice(start, end) || [];
  
  return currentFiles.map(({ filename, unique_id }, index) => ( // Destructure filename and unique_id here
    <tr key={index}>
      
       <td><FontAwesomeIcon icon={faFileAlt} className="fa-icon" /> {filename}</td>
      <td colSpan={3}>
        <FontAwesomeIcon
          icon={faEye}
          className="action-icon view-icon"
          onClick={() => viewFile(filename, activeFolder)} 
          style={{ cursor: 'pointer', marginRight: '15px' }} 
        />
        <FontAwesomeIcon
          icon={faTrash}
          className="action-icon delete-icon"
          onClick={() => deleteDocument(unique_id)} 
          style={{ cursor: 'pointer', marginRight: '15px'}} 
        />
      </td>
    </tr>
  ));
};



return (
  <div id="chatbot-page">
    <SideBarSmall />

    <div className="lib-container">
      <h1 className='heavy'>Company Library</h1>

      <div className="library-container mt-4">
        <Row>
          <Col md={12}>
          <Card className="lib-custom-card">
          <Card.Body style={{ height: '530px' }}>
            <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="lib-custom-card-title">Resources</h1>
              <div style={{ display: 'flex' }}>
                <Button
                  className="upload-button"
                  onClick={() => setShowUploadPdfModal(true)}
                  style={{ marginRight: '10px' }} // Add some space between the buttons
                >
                  Upload PDF
                </Button>
                <UploadPdfModal />
                <Button 
                  className="upload-button"
                  onClick={() => setShowUploadTextModal(true)}
                  style={{ backgroundColor: 'black' }}
                >
                  Upload Text
                </Button>
                <UploadTextModal />
              </div>
            </div>
            
            {/* Table Structure */}
            <table className="library-table">
              <thead>
                <tr>
                  <th>{activeFolder ? `Documents in ${activeFolder}` : 'Folders'}</th>
                  <th colSpan={3}>
                    {activeFolder && (
                      <Button className="upload-button" style={{backgroundColor: 'black'}} onClick={() => setActiveFolder(null)}>Back to Folders</Button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeFolder ? renderFolderContents() : renderFolders()}
              </tbody>
            </table>
          </Card.Body>
          <div className="pagination-controls mt-4">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => paginate(i + 1)} disabled={currentPage === i + 1} className="pagination-button">
                {i + 1}
              </button>
            ))}
          </div>
        </Card>

          </Col>
        </Row>
       
      </div>
      <FileContentModal />
    </div>
  </div>
);
}

export default withAuth(Library);
