import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { faEye, faBook } from '@fortawesome/free-solid-svg-icons';
import DashboardCard from "../components/DashboardCard.tsx";
import { faFileSignature, faComments } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import handleGAEvent from '../utilities/handleGAEvent';
import BidCard from "../components/BidCard.tsx";
import { Card, Col, Row, Modal, Button, Form, Alert } from "react-bootstrap";
import "./Dashboard.css"
import { TextField } from "@mui/material";
import CustomTextField from "../components/CustomTextField.tsx";
import { displayAlert } from "../helper/Alert.tsx";

const Dashboard = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bidName, setBidName] = useState('');
  const [bidNameError, setBidNameError] = useState('');

  const navigate = useNavigate()

  useEffect(() => {
    fetchBids();
  }, []);

  const [tasks, setTasks] = useState([
    { id: 1, description: 'Review Compliance Matrix', assignee: 'Jamie', status: 'To-Do' },
    { id: 2, description: 'Make final draft', assignee: 'Sam', status: 'To-Do' },
    { id: 3, description: 'Q3', assignee: 'Gerald', status: 'To-Do' },
    { id: 4, description: 'Exec Summary', assignee: 'Theresa', status: 'To-Do' },
  ]);

  const toggleTaskStatus = (id) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, status: task.status === 'To-Do' ? 'Done' : 'To-Do' } : task
      )
    );
  };

  const fetchBids = async () => {
    try {
      const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/get_bids_list/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });
      if (response.data && response.data.bids) {
        setBids(response.data.bids);
        console.log(response.data);
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const recentOngoingBids = bids
    .filter(bid => bid.status.toLowerCase() === 'ongoing')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4);

  const handleOngoingSidebarLinkClick = (label) => {
    handleGAEvent('Sidebar Navigation', 'Ongoing Link Click', 'ongoing link nav');
  };

  const handleWriteProposalClick = () => {
    setShowModal(true); // Show the modal when the card is clicked
  };

  const handleModalClose = () => {
    setShowModal(false);
    setBidName('');
  };

  const handleModalSubmit = () => {
    if (!bidName) {
      displayAlert('Bid name cannot be empty', 'danger');
      return;
    }
    if (bidName.length > 20) {
      displayAlert('Bid name cannot exceed 20 characters', 'danger');
      return;
    }
    if (bids.some(bid => bid.bid_title === bidName)) {
      displayAlert('Bid name already exists', 'danger');
      return;
    }

    localStorage.removeItem('bidInfo');
    localStorage.removeItem('backgroundInfo');
    localStorage.removeItem('response');
    localStorage.removeItem('inputText');
    localStorage.removeItem('editorState');
    localStorage.removeItem('messages');
    localStorage.removeItem('bidState');
    handleOngoingSidebarLinkClick('Write a Proposal click');
    navigate('/bid-extractor', { state: { bidName } });
    setShowModal(false);
  };


  const navigateToChatbot = (bid) => {
    localStorage.removeItem('bidInfo');
    localStorage.removeItem('backgroundInfo');
    localStorage.removeItem('response');
    localStorage.removeItem('inputText');
    localStorage.removeItem('editorState');
    localStorage.removeItem('messages');
    localStorage.removeItem('bidState');
    setSelectedBid(bid);  // Update the selected bid
    handleOngoingSidebarLinkClick('Ongoing bid click');
    localStorage.setItem('navigatedFromBidsTable', 'true');
    navigate('/bid-extractor', { state: { bid: bid, fromBidsTable: true } });
    fetchBids();
  };

  return (
    <div >
      <SideBarSmall />

      <div className="lib-container">
        <div className="mb-4">
          <h1 className='heavy'>Dashboard</h1>
        </div>

        <div className="dashboard-container">
          <DashboardCard
            icon={faFileSignature}
            title="Write a Proposal"
            description="Utilise a full scope AI toolkit to assist you with your proposal writing."
            path="/bid-extractor"
            onCardClick={handleWriteProposalClick}
          />
          <DashboardCard
            icon={faComments}
            title="Chat with mytender.io"
            description="Let AI assist you to find the document you are looking for."
            path="/chatResponse"
          />
          <DashboardCard
            icon={faEye}
            title="AI Bid/No Bid"
            description="Let AI help you quickly assess opportunities to help you decide whether to bid or not."
            path="/calculator"
          />
          <DashboardCard
            style={{ margin: '0px !important' }}
            icon={faBook}
            title="Company Library"
            description="Upload relevant company information."
            path="/library"
          />
        </div>
        <h1 className="lib-title mt-5 mb-4">Proposals</h1>
        <div className="dashboard-container">
          <div className="bidCardsContainer">
            {recentOngoingBids.map((bid, index) => (
              <Link
                key={bid.id || index}
                state={{ bid: bid, fromBidsTable: true }}
                onClick={() => navigateToChatbot(bid)}
                to={`/bid-extractor`} // Ensure you replace this with the correct path
                style={{ textDecoration: 'none' }} // Remove default link styling
              >
                <BidCard
                  title={bid.bid_title}
                  lastUpdated={bid.timestamp}
                  completion={60}
                />
              </Link>
            ))}
          </div>
        </div>

         {/* <div className="mt-4">
          <Row>
            <Col md={12}>
              <Card className="lib-custom-card mb-4">
                <Card.Body>
                  <h1 className="lib-custom-card-title">Your Tasks</h1>
                  <table className="task-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Assigned</th>
                        <th style={{ width: '100px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.description}</td>
                          <td>{task.assignee}</td>
                          <td>
                            <div className="task-status">
                              <label>
                                <input
                                  type="radio"
                                  checked={task.status === 'Done'}
                                  onChange={() => toggleTaskStatus(task.id)}
                                />
                                <span>{task.status}</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
     */}
 </div> 
 <Modal show={showModal} onHide={handleModalClose} className="custom-modal-newbid">
        <Modal.Header closeButton className="px-4 py-3">
          <Modal.Title>Enter Bid Name</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          <CustomTextField
            label="Bid Name"
            variant="outlined"
            fullWidth
            value={bidName}
            onChange={(e) => setBidName(e.target.value)}
            placeholder="Enter bid name"
            inputProps={{ maxLength: 20 }}
          />
          <div className="mt-3">
            <Button className="upload-button" onClick={handleModalSubmit}>
              Submit
            </Button>
          </div>
        </Modal.Body>
      </Modal>
        </div>
      );
    }

export default withAuth(Dashboard);
