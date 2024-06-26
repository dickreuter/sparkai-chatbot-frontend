import React, { useState, useEffect, useRef } from 'react';
import { useAuthUser } from 'react-auth-kit';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { Link } from "react-router-dom";
import "./Bids.css";
import { useNavigate } from 'react-router-dom';
import SideBarSmall from '../routes/SidebarSmall.tsx' ;
import handleGAEvent from '../utilities/handleGAEvent.tsx';
import { Dropdown } from 'react-bootstrap';

const Bids = () => {
    const [bids, setBids] = useState([]);
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    const navigate = useNavigate()

    const navigateToChatbot = (bid) => {
      localStorage.setItem('navigatedFromBidsTable', 'true');
      navigate('/bid-extractor', { state: { bid: bid, fromBidsTable: true } });
      handleGAEvent('Bid Tracker', 'Navigate to Bid', 'Bid Table Link');
    };

    // Encapsulate the bid-fetching logic into its own function
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
        fetchBids(); // Call fetchBids on component mount
    }, []);

    const deleteBid = async (bidTitle) => {
        const formData = new FormData();
        formData.append('bid_title', bidTitle);

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

            fetchBids(); // Refetch bids after successful deletion
            handleGAEvent('Bid Tracker', 'Delete Bid', 'Delete Bid Button');
        } catch (error) {
            console.error("Error deleting bid:", error);
        }
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


            // Optimistically update the local state
            handleGAEvent('Bid Tracker', 'Change Bid Status', 'Bid Status Dropdown');
            setTimeout(fetchBids, 500);

        } catch (error) {
            console.error("Error updating bid status:", error);
            // Optionally revert the optimistic update in case of error
            // fetchBids();
        }
    };




    return (
        <div >
            <SideBarSmall />


            <div className="lib-container">
                <h1 className='heavy'>Bid Repository</h1>
                <table className="bids-table mt-3">
                    <thead>
                        <tr>
                            <th>Bid Title</th>
                            <th>Last edited</th>
                            <th>Status</th>

                            <th>Delete Bid</th>
                        </tr>
                    </thead>
                    <tbody>
                    {bids.map((bid, index) => (
                        <tr key={index}>
                        <td>
                        <Link to="/bid-extractor" state={{ bid: bid, fromBidsTable: true }} onClick={() => navigateToChatbot(bid)}>
                            {bid.bid_title}
                        </Link>
                        </td>
                        <td>Last edited: {new Date(bid.timestamp).toLocaleDateString()}</td>
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

                        <td>

                            <button
                            onClick={() => deleteBid(bid.bid_title)}
                            className="upload-button"
                           
                            >
                            Delete
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Bids;
