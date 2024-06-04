import React, {useEffect, useRef, useState} from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx' ;
import { faEye, faBook} from '@fortawesome/free-solid-svg-icons';
import DashboardCard from "../components/DashboardCard.tsx";
import { faFileSignature, faComments  } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import handleGAEvent from '../utilities/handleGAEvent';
import BidCard from "../components/BidCard.tsx";
import { Card, Col, Row } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import ProposalEditor from "./ProposalEditor.tsx";
import "./Proposal.css";

const Proposal = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);

  const navigate = useNavigate()

  const bidData = location.state?.bid || ' ';
  const [appendResponse, setAppendResponse] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("-1");

return (
    <div className="chatpage">
            <SideBarSmall />

            <div className="lib-container">
                <BidNavbar/>
                <div>
                <h1 className='heavy'>Proposal</h1>
                </div>
                {bidData ? (
                    <ProposalEditor
                        bidData={bidData}
                        appendResponse={appendResponse}
                        selectedQuestionId={selectedQuestionId}
                        setSelectedQuestionId={setSelectedQuestionId}
                    />
                ) : (
                    <div>Loading or no bid data available...</div>
                )}
               

            </div>
    </div>
  
);
}

export default withAuth(Proposal);
