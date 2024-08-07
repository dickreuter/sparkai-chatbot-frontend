import React, { useState, useEffect, useRef } from 'react';
import { useAuthUser } from 'react-auth-kit';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { Link } from "react-router-dom";
import "./Bids.css";
import { useNavigate } from 'react-router-dom';
import SideBarSmall from '../routes/SidebarSmall.tsx' ;
import handleGAEvent from '../utilities/handleGAEvent.tsx';
import { Button, Modal } from 'react-bootstrap';
import { displayAlert } from '../helper/Alert.tsx';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomTextField from '../components/CustomTextField.tsx';

const Bids = () => {
    const [bids, setBids] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [bidName, setBidName] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bidToDelete, setBidToDelete] = useState(null);
    const [sortCriteria, setSortCriteria] = useState('lastEdited'); // New state for sorting criteria

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    const navigate = useNavigate();

    const navigateToChatbot = (bid) => {
        localStorage.setItem('navigatedFromBidsTable', 'true');
        localStorage.removeItem('bidState');
        navigate('/bid-extractor', { state: { bid: bid, fromBidsTable: true } });
        handleGAEvent('Bid Tracker', 'Navigate to Bid', 'Bid Table Link');
    };

    const fetchBids = async () => {
        try {
            const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/get_bids_list/`,
                {}, {
                    headers: {
                        Authorization: `Bearer ${tokenRef.current}`,
                    },
                });
            if (response.data && response.data.bids) {
                setBids(response.data.bids);
            }
        } catch (error) {
            console.error("Error fetching bids:", error);
        }
    };

    useEffect(() => {
        fetchBids();
    }, []);

    const confirmDeleteBid = async () => {
        if (bidToDelete) {
            const formData = new FormData();
            formData.append('bid_title', bidToDelete);

            try {
                await axios.post(
                    `http${HTTP_PREFIX}://${API_URL}/delete_bid/`,
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${tokenRef.current}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                fetchBids();
                handleGAEvent('Bid Tracker', 'Delete Bid', 'Delete Bid Button');
            } catch (error) {
                console.error("Error deleting bid:", error);
            } finally {
                setShowDeleteModal(false);
            }
        }
    };

    const handleDeleteClick = (bidTitle) => {
        setBidToDelete(bidTitle);
        setShowDeleteModal(true);
    };

    const updateBidStatus = async (bidTitle, newStatus) => {
        try {
            const formData = new FormData();
            formData.append('bid_title', bidTitle);
            formData.append('status', newStatus);

            await axios.post(`http${HTTP_PREFIX}://${API_URL}/update_bid_status/`,
                formData, {
                    headers: {
                        'Authorization': `Bearer ${tokenRef.current}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });

            handleGAEvent('Bid Tracker', 'Change Bid Status', 'Bid Status Dropdown');
            setTimeout(fetchBids, 500);
        } catch (error) {
            console.error("Error updating bid status:", error);
        }
    };

    const handleWriteProposalClick = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setBidName('');
    };

    const handleOngoingSidebarLinkClick = (label) => {
        handleGAEvent('Sidebar Navigation', 'Ongoing Link Click', 'ongoing link nav');
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

    // Sorting bids based on the selected criteria
    const sortedBids = [...bids].sort((a, b) => {
        const dateA = new Date(a.submission_deadline);
        const dateB = new Date(b.submission_deadline);

        if (sortCriteria === 'lastEdited') {
            return new Date(b.timestamp) - new Date(a.timestamp);
        } else if (sortCriteria === 'submissionDeadline') {
            // Handle invalid dates
            if (isNaN(dateA) && isNaN(dateB)) {
                return 0;
            } else if (isNaN(dateA)) {
                return 1;
            } else if (isNaN(dateB)) {
                return -1;
            } else {
                return dateA - dateB;
            }
        }
        return 0;
    });

    return (
        <div >
            <SideBarSmall />

            <div className="lib-container">
                <div className='proposal-header'>
                    <h1 className='heavy'>Dashboard</h1>
                    <div style={{display: 'flex'}}>
                        <div className="sort-options ">
                            <label htmlFor="sort-select">Sort by:</label>
                            <select 
                                id="sort-select" 
                                className="sort-select" 
                                onChange={(e) => setSortCriteria(e.target.value)}
                            >
                                <option className='sort-select-option' value="lastEdited">Last Edited</option>
                                <option className='sort-select-option' value="submissionDeadline">Submission Deadline</option>
                            </select>
                        </div>
                        <Button onClick={handleWriteProposalClick} className="upload-button">
                            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                            New Bid
                        </Button>
                    </div>

                </div>

                <table className="bids-table mt-3">
                    <thead>
                        <tr>
                            <th style={{ width: "18%" }}>Bid Title</th>
                            <th>Last edited</th>
                            <th>Status</th>
                            <th>Client</th>
                            <th style={{ width: "10%" }}>Deadline</th>
                            <th>Bid Manager</th>
                            <th style={{ width: "15%" }}>Opportunity Owner</th>
                            <th style={{ textAlign: "center" }}>Delete</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedBids.map((bid, index) => (
                            <tr key={index}>
                                <td>
                                    <Link to="/bid-extractor" state={{ bid: bid, fromBidsTable: true }} onClick={() => navigateToChatbot(bid)}>
                                        {bid.bid_title}
                                    </Link>
                                </td>
                                <td>{bid.timestamp ? new Date(bid.timestamp).toLocaleDateString() : ''}</td>
                                <td>
                                    <select
                                        className={`status-dropdown ${bid.status.toLowerCase()}`}
                                        value={bid.status.toLowerCase()}
                                        onChange={(e) => updateBidStatus(bid.bid_title, e.target.value)}
                                    >
                                        <option value="ongoing">Ongoing</option>
                                        <option value="complete">Complete</option>
                                    </select>
                                </td>
                                <td>{bid.client_name}</td>
                                <td>
                                    {bid.submission_deadline && !isNaN(new Date(bid.submission_deadline)) ? 
                                        new Date(bid.submission_deadline).toLocaleDateString() : 
                                        ''
                                    }
                                </td>
                                <td>{bid.bid_manager}</td>
                                <td>{bid.opportunity_owner}</td>
                                <td style={{ textAlign: "center" }}>
                                    <FontAwesomeIcon
                                        icon={faTrash}
                                        onClick={() => handleDeleteClick(bid.bid_title)}
                                        style={{ cursor: 'pointer', justifyContent: 'center' }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete the bid "{bidToDelete}"?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDeleteBid}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Bids;
