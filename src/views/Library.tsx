import { useRef, useState } from 'react';
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
import UploadTemplateText from '../components/UploadTemplateText';

const Library = () => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
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
              Response Generator
            </Button>
          </Link>
          </div>
          <div className="library-container mt-3">
             <Row>
              <Col md={8}>
                <div className="library-table">
                  

                 
                  <Card className="flex-fill mr-3"> {/* Add margin-right as needed */}
                    <Card.Header>Knowledge Base</Card.Header>
                    <Card.Body>
                      <table className="bids-table">
                          <thead>
                            <tr>
                              <th>Company Library</th>
                              <th>History</th>
                              <th>Actions</th>
                            
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Staff Structure</td>
                              <td>Last opened: 07/02/2024</td>
                              <td>View Delete</td>
                           
                            </tr>
                            {/* Additional dummy bids */}
                            <tr>
                              <td>Bid Structure</td>
                              <td>Last opened: 06/02/2024</td>
                              <td>View Delete</td>
                            </tr>
                            <tr>
                              <td> Company Culture</td>
                              <td>Last opened: 05/02/2024</td>
                              <td>View Delete</td>
                            </tr>
                            <tr>
                              <td>Sales Material</td>
                              <td>Last opened: 04/02/2024</td>
                              <td>View Delete</td>
                            </tr>
                            <tr>
                              <td>GANT Chart</td>
                              <td>Last opened: 03/02/2024</td>
                              <td>View Delete</td>
                            </tr>
                          
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
