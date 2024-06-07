import React, {useEffect, useRef, useState} from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx' ;
import { faEye, faBook} from '@fortawesome/free-solid-svg-icons';
import DashboardCard from "../components/DashboardCard.tsx";
import { faFileSignature, faComments  } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import handleGAEvent from '../utilities/handleGAEvent';
import BidCard from "../components/BidCard.tsx";
import { Button, Card, Col, Row } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import ProposalEditor from "./ProposalEditor.tsx";
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import "./Proposal.css";

const Proposal = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  
  const location = useLocation();
  const bidData = location.state?.bid || ' ';
  const [bidInfo, setBidInfo] = useState(
    localStorage.getItem('bidInfo') || ''
  );
  const [backgroundInfo, setBackgroundInfo] = useState(
    localStorage.getItem('backgroundInfo') || ''
  );
  const [response, setResponse] = useState(
    localStorage.getItem('response') || ''
  );

  const [isLoading, setIsLoading] = useState(false);


  const [appendResponse, setAppendResponse] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("-1");

  const [isSaved, setIsSaved] = useState(false);


  const retrieveEditorState = () => {
    const savedData = localStorage.getItem('editorState');
    if (savedData) {
        const rawContent = JSON.parse(savedData);
        const contentState = convertFromRaw(rawContent);
        return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
};

    const exportToDocx = (editorState) => {
        if (!editorState) {
            console.error("No editor state available");
            return;
        }

        // Convert editor state to plain text or implement your HTML to DOCX logic here
        const contentState = editorState.getCurrentContent();
        const contentText = contentState.getPlainText('\n');

        // Create a new document
        const doc = new Document({
            sections: [{
                properties: {},
                children: contentText.split('\n').map(line => new Paragraph({
                    children: [new TextRun(line)]
                }))
            }]
        });

        // Used Packer to create a Blob
        Packer.toBlob(doc).then(blob => {
            // Save the Blob as a DOCX file
            saveAs(blob, 'proposal.docx');
        }).catch(err => {
            console.error('Error creating DOCX:', err);
        });
    };



  const saveProposal = async () => {
    // Retrieve the saved editor state from local storage
   
    const savedData = localStorage.getItem('editorState');
    let editorText = '';
    if (savedData) {
        const contentState = convertFromRaw(JSON.parse(savedData));
        editorText = contentState.getBlocksAsArray().map(block => block.getText()).join('\n');
    }

    const formData = new FormData();
    formData.append('bid_title', bidInfo);
    formData.append('text', editorText);
    formData.append('status', 'ongoing');
    formData.append('contract_information', backgroundInfo);



    try {
        const result = await axios.post(
            `http${HTTP_PREFIX}://${API_URL}/upload_bids`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${tokenRef.current}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );


        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000); // Reset after 3 seconds
    } catch (error) {
        console.error("Error saving proposal:", error);
        setResponse(error.message);
    }
    handleGAEvent('Chatbot', 'Save Proposal', 'Save Proposal Button');

};

return (
    <div className="chatpage">
            <SideBarSmall />

            <div className="lib-container">
                <BidNavbar/>
                
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
               
               <Row>
                            <div className="mb-4">
                            <Button
                                variant={isSaved ? "success" : "primary"}
                                onClick={saveProposal}
                                className={`mt-1 upload-button ${isSaved && 'saved-button'}`}
                                disabled={isLoading || isSaved} // Consider disabling the button while saving or after saved
                            >
                                {isSaved ? "Saved" : "Save Proposal"}
                            </Button>
                            <Button
                                variant={"primary"}
                                onClick={() => exportToDocx(retrieveEditorState())} // Use an arrow function to delay execution
                                className="mt-1 ml-2 upload-button"
                                disabled={isLoading}
                                style={{marginLeft: "5px", backgroundColor: "black"}}
                            >
                                Export to Word
                            </Button>


                            </div>
                </Row>


            </div>
    </div>


  
);
}

export default withAuth(Proposal);
