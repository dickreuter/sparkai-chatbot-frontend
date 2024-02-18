import React, {useEffect, useRef, useState} from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import {Button, Col, Container, Form, Row, Spinner, Card} from "react-bootstrap";
import { Link } from 'react-router-dom';
import UploadPDF from './UploadPDF';
import UploadText from './UploadText';
import "./Library.css";
import UploadTemplateText from '../components/UploadTemplateText';
import Tooltip from "@mui/material/Tooltip";
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';



const Library = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [availableCollections, setAvailableCollections] = useState([]);
  const [folderContents, setFolderContents] = useState({});

  const fetchFolderFilenames = async (folderName) => {
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_folder_filenames`,
        { collection_name: folderName },
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );

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

useEffect(() => {
  const get_collections = async () => {
    try {
      const res = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_collections`,
        {},
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
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
        <div className="App">
           <div className="text-center">
          <h1 className='fw-bold'>Library</h1>
          <Link to="/chatbot">
            <Button
              variant="primary"
              className="chat-button mt-3"
            >
              Response Generator
            </Button>
          </Link>
          </div>
          <div className="library-container mt-3">

       


             <Row>
              <Col md={8}>
                <div className="library-table">
                  

                 
                <Card className="flex-fill mr-3">
              <Card.Header>Knowledge Base</Card.Header>
              <Card.Body style={{ overflowY: 'auto'}}>
                <table className="bids-table mb-3">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Folder</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(folderContents).map(([folderName, files]) => 
                      files.map((file, index) => (
                        <tr key={index}>
                          <td>{file}</td>
                          <td>{folderName}</td>
                          <td className="text-center">
                            <Button variant="primary">View</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card.Body>
            </Card>
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
                <div className="mt-3">
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
                <div className="mt-3">
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
          
        </div>
      );
}

export default withAuth(Library);