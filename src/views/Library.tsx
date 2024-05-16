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
import { faEye, faTrash, faFolder, faFileAlt,  faArrowUpFromBracket, faEllipsisVertical} from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UploadPDFModal, UploadTextModal, UploadButtonWithDropdown } from "./UploadButtonWithDropdown.tsx";


const Library = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");


  const [availableCollections, setAvailableCollections] = useState([]);
  const [folderContents, setFolderContents] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 9;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const [totalPages, setTotalPages] = useState(0);

  const [activeFolder, setActiveFolder] = useState(null);

  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);

  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState('');

  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const [uploadFolder, setUploadFolder] = useState(null);

  const handleDelete = async (folderTitle) => {
    // Your delete folder logic here
    console.log('Deleting folder:', folderTitle);
    setFolderToDelete(''); // Reset folderToDelete after deletion
    deleteFolder(folderTitle);
    setShowDeleteFolderModal(false); // Close modal after deletion
  };

  const handleDeleteFileClick = (event, unique_id, filename) => {
    event.stopPropagation(); // Prevents the row click event
    setFileToDelete({ unique_id, filename });
    setShowDeleteFileModal(true);
  };
  

  const handleShowPDFModal = (event, folder) => {
    event.stopPropagation();  // Stop the event from propagating further
    setUploadFolder(folder);  // Set the folder state
    setShowPDFModal(true);    // Show the PDF upload modal
};

const handleShowTextModal = (event, folder) => {
    event.stopPropagation();  // Stop the event from propagating further
    setUploadFolder(folder);  // Set the folder state
    setShowTextModal(true);   // Show the Text upload modal
};

const handleOpenPDFModal = () => {
  setUploadFolder(null);  // Reset the upload folder to null
  setShowPDFModal(true);  // Open the PDF upload modal
};

const handleOpenTextModal = () => {
  setUploadFolder(null);  // Reset the upload folder to null
  setShowTextModal(true);  // Open the Text upload modal
};


  const UploadPDFModal = ({ show, onHide, folder, get_collections }) => (
    <Modal 
        show={show} 
        onHide={() => { onHide(); }}  // Removed e.stopPropagation() here, may not be necessary
        onClick={(e) => e.stopPropagation()}  // Correct usage
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

const UploadTextModal = ({ show, onHide, folder, get_collections }) => (
    <Modal 
        show={show} 
        onHide={() => { onHide(); }}  // Removed e.stopPropagation() here, may not be necessary
        onClick={(e) => e.stopPropagation()}  // Correct usage
        size="lg"
    >
        <Modal.Header closeButton onClick={(e) => e.stopPropagation()}>
            <Modal.Title>Text Uploader</Modal.Title>
        </Modal.Header>
        <Modal.Body onClick={(e) => e.stopPropagation()}>
            <UploadText folder={folder} get_collections={get_collections} onClose={onHide} />
        </Modal.Body>
    </Modal>
);


const DeleteFolderModal = ({ show, onHide, onDelete, folderTitle }) => {
  return (
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
};

const DeleteFileModal = ({ show, onHide, onDelete, fileName }) => {
  return (
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
};



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
    //console.log(response.data);

    // Create an array of objects, each containing both the filename and unique_id
    const filesWithIds = response.data.map(item => ({
      filename: item.meta,
      unique_id: item.unique_id
    }));

    //console.log(filesWithIds);

    // Update folderContents with the new array of objects
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
      //console.log("deleted")
      get_collections();
  } catch (error) {
      console.error("Error deleting document:", error);
  }
};

const deleteFolder = async (folderTitle) => {
  //console.log("delete folder")
  //console.log(folderTitle);
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
  get_collections();
}, []); // Empty dependency array means this effect runs only on mount


useEffect(() => {
  if (activeFolder === null) {
    setCurrentPage(1); // Reset to page 1 only when the active folder is deselected
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
        {folder}
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
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const currentFiles = folderContents[activeFolder]?.slice(start, end) || [];
  
  return currentFiles.map(({ filename, unique_id }, index) => (
    <tr key={index} onClick={() => viewFile(filename, activeFolder)} style={{ cursor: 'pointer' }}>
      <td><FontAwesomeIcon icon={faFileAlt} className="fa-icon" /> {filename}</td>
      <td colSpan={3}>
        <FontAwesomeIcon
          icon={faTrash}
          className="action-icon delete-icon"
          onClick={(event) => handleDeleteFileClick(event, unique_id, filename)}
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
          <Card.Body style={{ height: '560px' }}>
            <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="lib-custom-card-title">Resources</h1>
              <div style={{ display: 'flex' }}>
                <Button
            className="upload-button"
            onClick={handleOpenPDFModal}
            style={{ marginRight: '10px' }} // Add some space between the buttons
        >
            Upload PDF
        </Button>
       
        <Button 
            className="upload-button"
            onClick={handleOpenTextModal}
            style={{ backgroundColor: 'black' }}
        >
            Upload Text
        </Button>
            
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
            setShowDeleteFileModal(false); // Close the modal after deletion
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
        

       
    </div>
  </div>
);
}

export default withAuth(Library);
