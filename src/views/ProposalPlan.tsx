import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { useLocation } from 'react-router-dom';
import { Button, Card, Col, Row, Spinner } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import './BidExtractor.css';
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { displayAlert } from "../helper/Alert.tsx";

const ProposalPlan = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, setSharedState} = useContext(BidContext);
  const { 
    bidInfo: contextBidInfo, 
    opportunity_information, 
    compliance_requirements,
    questions, 
    contributors,
    object_id
  } = sharedState;


  const location = useLocation();

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  const generateOutline = async () => {
    setIsGeneratingOutline(true);
    const formData = new FormData();
    formData.append('bid_id', object_id);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/generate_outline`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      setSharedState(prevState => ({
        ...prevState,
        opportunity_information: result.data.opportunity_information
      }));

      displayAlert("Opportunity information generated successfully!", 'success');
    } catch (err) {
      console.error('Error generating opportunity information:', err);
      if (err.response && err.response.status === 404) {
        displayAlert("No documents found in the tender library. Please upload documents before generating opportunity information.", 'warning');
      } else {
        displayAlert("No documents found in the tender library. Please upload documents before generating opportunity information.", 'danger');
      }
    } finally {
      setIsGeneratingOutline(false);
    }
  };


  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container" >
        <div className="scroll-container">
        <BidNavbar  />

        </div>
        </div>
    </div>
    
  );
}

export default withAuth(ProposalPlan);
