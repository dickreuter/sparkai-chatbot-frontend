import React, {useEffect, useRef, useState} from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import {Button, Col, Container, Form, Row, Spinner, Card, Modal} from "react-bootstrap";
import { Link } from 'react-router-dom';
import UploadPDF from './UploadPDF';
import UploadText from './UploadText';
import "./Library.css";
import UploadTemplateText from '../components/UploadTemplateText';
import Tooltip from "@mui/material/Tooltip";
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SideBar from '../routes/Sidebar.tsx'; 
import SideBarSmall from '../routes/SidebarSmall.tsx' ;
import NavBar from '../routes/NavBar';
import handleGAEvent from "../utilities/handleGAEvent.tsx";

const Library = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const [profileName, setProfileName] = useState("default");

  const [availableCollections, setAvailableCollections] = useState([]);
  const [folderContents, setFolderContents] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  //pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;


  // Function to change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
    // Calculate the rows to display
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = Object.entries(folderContents).slice(indexOfFirstRow, indexOfLastRow);

// This creates a flat list of { fileName, folderName } objects for all files
const flatFiles = Object.entries(folderContents).reduce((acc, [folderName, files]) => {
  const folderFiles = files.map(fileName => ({ folderName, fileName }));
  return [...acc, ...folderFiles];
}, []);

// Now apply pagination to flatFiles
const totalRows = flatFiles.length;
const totalPages = Math.ceil(totalRows / rowsPerPage);
const currentFiles = flatFiles.slice(indexOfFirstRow, indexOfLastRow);

const [showUploadPdfModal, setShowUploadPdfModal] = useState(false);
// Rest of your component logic

// Modal Component for UploadPDF
const UploadPdfModal = () => (
  <Modal  show={showUploadPdfModal} onHide={() => setShowUploadPdfModal(false)} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>PDF Uploader</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <UploadPDF /> {/* Your UploadPDF component here */}
    </Modal.Body>
    
  </Modal>
);
// Modal component to display file content
const FileContentModal = () => (
  <Modal  show={showModal} onHide={() => setShowModal(false)} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>File Content</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <pre style={{ textAlign: 'center' }}>{modalContent}</pre> {/* Centered text */}
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

      //console.log("fetchfoldernames");
      //console.log(response.data);

      // Ensure response.data structure is correctly handled here
      setFolderContents(prevContents => ({
        ...prevContents,
        [folderName]: response.data // Adjust according to actual response structure
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


useEffect(() => {
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
  get_collections();
}, []); // Removed tokenRef from dependencies to avoid refetching on token change


return (
      <div id="chatbot-page">
        <SideBarSmall />
        
    
          <div className="lib-container">
    
                <h1  className='heavy'>Company Library</h1>
                
                <div className="library-container mt-4">
                


                  <Row>
                  <Col md={12}>
                  <Card className="lib-custom-card">
                    <Card.Body>
                      <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 className="lib-custom-card-title">Resources</h1>
                        <Button 
                          className="upload-button" 
                          onClick={() => {
                            setShowUploadPdfModal(true);
                            handleGAEvent('Library', 'Upload PDF', 'Upload PDF Button');
                          }}
                        >
                          Upload PDF
                        </Button>
                        <UploadPdfModal />

                      </div>
                      <table className="library-table">
                          <thead>
                            <tr>
                              <th>Filename</th>
                              <th>Folder</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentFiles.length > 0 ? currentFiles.map(({ fileName, folderName }, index) => (
                              <tr key={index}>
                                <td>{fileName}</td>
                                <td>{folderName}</td>
                                <td >
                                  <Button className="upload-button" style={{backgroundColor: 'black'}} onClick={() => viewFile(fileName, folderName)}>View</Button>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan="3" className="text-center">No collections or files available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        <div className="pagination-controls">
                          {[...Array(totalPages)].map((e, i) => (
                            <button key={i} onClick={() => paginate(i + 1)} disabled={currentPage === i + 1} className="pagination-button">
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  </Row>
                   
                    <Row>
                      <Col md={12}>
                          <Card className="lib-custom-card mt-4">
                          <h1 className="lib-custom-card-title" >Text Uploader</h1>
                            <Card.Body >
                              <UploadText />
                            </Card.Body>
                          </Card>
                        
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <div className="mt-4">
                          <Card className="lib-custom-card mt-4">
                          <h1 className="lib-custom-card-title" >Template Uploader</h1>
                            <Card.Body>
                              <UploadTemplateText></UploadTemplateText>
                            </Card.Body>
                          </Card>
                        </div>
                      </Col>
                    </Row>
                  
                   
                  
                   
                        

                </div>
                <FileContentModal />
               
               
          </div>
        
      </div>

  );
}

export default withAuth(Library);