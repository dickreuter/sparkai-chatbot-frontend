import { useRef, useState } from 'react';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import {Button, Col, Container, Form, Row, Spinner} from "react-bootstrap";
import { Link } from 'react-router-dom';

const Library = () => {
    return (
        <div className="App">
          <h1>Library</h1>
          <Link to="/">
          <Button
            variant="primary"
            className="chat-button mt-3"
          >
            New Bid
          </Button>
        </Link>
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
        </div>
      );
}

export default withAuth(Library);
