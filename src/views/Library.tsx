import { useRef, useState } from 'react';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
<<<<<<< HEAD
import {Button, Col, Container, Form, Row, Spinner, Card} from "react-bootstrap";
import { Link } from 'react-router-dom';
import UploadPDF from './UploadPDF';
import "./Library.css";
=======

>>>>>>> 20f51b1 (sidebar)

const Library = () => {
    return (
        <div className="App">
<<<<<<< HEAD

          <h1>Library</h1>
          <Link to="/">
            <Button
              variant="primary"
              className="chat-button mt-3"
            >
              New Bid
            </Button>
          </Link>
          <div className="library-container mt-3">
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
                <div className="upload-component">
                  <Card className="flex-fill">
                    <Card.Header>Train AI on Documents</Card.Header>
                      <Card.Body>
                        <UploadPDF />
                      </Card.Body>
                  </Card>

                </div>
                  

          </div>
          
=======
          <h1>Library</h1>
          <table className="bids-table">
            <thead>
              <tr>
                <th>Company Library</th>
                <th>History</th>
                <th>Upload Text</th>
                <th>Upload PDF</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Staff Structure</td>
                <td>Last opened: 07/02/2024</td>
                <td>View</td>
                <td>Delete</td>
              </tr>
              {/* Additional dummy bids */}
              <tr>
                <td>Bid Structure</td>
                <td>Last opened: 06/02/2024</td>
                <td>View</td>
                <td>Delete</td>
              </tr>
              <tr>
                <td> Company Culture</td>
                <td>Last opened: 05/02/2024</td>
                <td>View</td>
                <td>Delete</td>
              </tr>
              <tr>
                <td>Sales Material</td>
                <td>Last opened: 04/02/2024</td>
                <td>View</td>
                <td>Delete</td>
              </tr>
              <tr>
                <td>GANT Chart</td>
                <td>Last opened: 03/02/2024</td>
                <td>View</td>
                <td>Delete</td>
              </tr>
              {/* Continue adding more dummy bids as needed */}
            </tbody>
          </table>
>>>>>>> 20f51b1 (sidebar)
        </div>
      );
}

export default withAuth(Library);
