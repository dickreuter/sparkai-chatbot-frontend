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
import "./QuestionsCrafter.css";
const QuestionCrafter = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);

  const navigate = useNavigate()

  

return (
    <div className="chatpage">
            <SideBarSmall />

            <div className="lib-container">
                <BidNavbar/>
                <div className="mb-4">
                <h1 className='heavy'>Question Crafter</h1>
                </div>
                <div className="library-container">
            
            <Row >
                <Col md={8}>
                <div className="card-title-container">
                  <div className="tooltip-container">
                      <i className="fas fa-info-circle tooltip-icon"></i>
                      <span className="tooltip-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>
                  </div>
                  <h1 className="lib-title">Bid Pilot</h1>
                </div>
                <div className="question-extractor">
                <input type="text" className="card-input" placeholder="Enter bid proposition here..." />
              </div>
              </Col>
              <Col md={4}>
             
                  <h1 className="lib-title">Bid Pilot</h1>
                
                <div className="question-extractor">
                <input type="text" className="card-input" placeholder="Enter bid proposition here..." />
              </div>
              </Col>
            </Row>
        </div>
               

            </div>
    </div>
  
);
}

export default withAuth(QuestionCrafter);
