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

  
// Modal component to display file content
const FileContentModal = () => (
  <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>File Content</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <pre style={{ textAlign: 'center' }}>{modalContent}</pre> {/* Centered text */}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowModal(false)}>
        Close
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

      console.log("fetchfoldernames");
      console.log(response.data);

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
    console.log(folderName);
    console.log(fileName);
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
      console.log(response.data);
      setModalContent(response.data); // Assume response.data is the content you want to display
      setShowModal(true);
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
      console.log("response");
      console.log(res.data);
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

const renderFilesOrCollectionName = (files, folderName) => {
  // If no files are present or an error occurred fetching files,
  // display a row with the folderName as the file name
  if (!files || files.length === 0) {
    return (
      <tr>
        <td>{folderName}</td>
        <td>{folderName}</td> {/* Display folderName as filename if no files */}
        <td className="text-center">N/A</td> {/* Adjust action as needed */}
      </tr>
    );
  }
  // If files are present, render them as usual
  return files.map((file, index) => (
    <tr key={index}>
      <td>{file}</td>
      <td>{folderName}</td>
      <td className="text-center">
        <Button variant="primary" onClick={() => viewFile(file, folderName)}>View</Button>
      </td>
    </tr>
  ));
};



return (
      <div id="chatbot-page">
        <SideBarSmall />
        
    
          <div className="lib-container">
    
                <h1  className='heavy'>Company Library</h1>
                
                <div className="library-container mt-4">
                


                  <Row>
                    <Col md={8}>
                   

                      
                         
                          <table className="bids-table mb-3">
                            <thead>
                              <tr>
                                <th>Filename</th>
                                <th>Folder</th>
                                <th className="text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                          {currentFiles.length > 0 ? currentFiles.map(({ fileName, folderName }, index) => (
                            // Directly render each file's row, as each file now includes its folder context
                            <tr key={index}>
                              <td>{fileName}</td>
                              <td>{folderName}</td>
                              <td className="text-center">
                                <Button variant="primary" onClick={() => viewFile(fileName, folderName)}>View</Button>
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
                              <button key={i} onClick={() => paginate(i + 1)} disabled={currentPage === i + 1}>
                                {i + 1}
                              </button>
                            ))}
                          </div>

                        
                     
                    </Col>

                    <Col md={4}>
                    <div className="upload-component">
                        <Card className="flex-fill">
                          <Card.Header>Train AI on PDF Documents</Card.Header>
                            <Card.Body className='text-center'>
                              <UploadPDF />
                            </Card.Body>
                        </Card>

                      </div>
                    </Col>
                  
                    </Row>
                    <Row>
                      <Col md={12}>
                      <div className="mt-4">
                          <Card className="flex-fill">
                            <Card.Header>Train AI on Text</Card.Header>
                              <Card.Body className='text-center'>
                                <UploadText />
                              </Card.Body>
                          </Card>

                        </div>
                        </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                      <div className="mt-4">
                          <Card className="flex-fill">
                            <Card.Header>Add Templates</Card.Header>
                              <Card.Body className='text-center'>
                                <UploadTemplateText />
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