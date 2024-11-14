import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import SelectFolder from "../components/SelectFolder";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const GenerateProposalModal = ({ onSaveSelectedFolders, initialSelectedFolders = [], bid_id }) => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const tokenRef = useRef(auth?.token || "default");
    const [show, setShow] = useState(false);
    const [isGeneratingProposal, setIsGeneratingProposal ] = useState(false);
    const [selectedFolders, setSelectedFolders] = useState(() => {
        const initialSelection = new Set(initialSelectedFolders);
        return Array.from(initialSelection);
    });

    const generateProposal = async () => {
        try {
            setIsGeneratingProposal(true);
            const formData = new FormData();
            formData.append('bid_id', bid_id);
            
            const response = await axios.post(
                `http${HTTP_PREFIX}://${API_URL}/generate_proposal`,
                formData,
                {
                headers: {
                    'Authorization': `Bearer ${tokenRef.current}`,
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob'  // Important for handling file downloads
                }
            );
            
            // Create a blob from the response data
            const blob = new Blob([response.data], { type: 'application/msword' });
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element and trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.download = response.headers['content-disposition']?.split('filename=')[1] || 'proposal.docx';
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

        } catch (err) {
        console.error('Error generating proposal:', err);
        } finally {
            setIsGeneratingProposal(false);
        }
    };

    const handleShow = () => setShow(true);
    const handleClose = () => {
        console.log("Closing modal. Selected folders:", selectedFolders);

        setShow(false);
    };
    const handleFolderSelection = (folders) => {
        console.log("Folders selected in SelectFolder component:", folders);
        setSelectedFolders(folders);
        onSaveSelectedFolders(selectedFolders);
    };
    useEffect(() => {
        console.log("selectedFolders state updated:", selectedFolders);
    }, [selectedFolders]);

    const handleNext = async () => {
        if (currentStep === 1) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            generateProposal();
        }
    };

    const handleBack = () => {
        if (currentStep === 2) {
            setCurrentStep(1);
        } else {
            setShow(false);
        }
    };

    const getButtonLabel = () => {
        switch (currentStep) {
            case 1:
                return "Next";
            case 2:
                return isGeneratingProposal ? (
                    <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Processing...
                    </>
                ) : "Finish";
        }
    };

    const getHeaderTitle = () => {
        return `Step ${currentStep} of 2`; 
    };

    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <div className="p-4">
                    <div className="px-3">
                    Select the folders below from your content library to use as context in your final proposal. The AI will be able to use information from these when generating an answer for each section.
                    </div>
                    
                    <div className="selectfolder-container mt-3">
                        <SelectFolder
                        onFolderSelect={handleFolderSelection}
                        initialSelectedFolders={selectedFolders}
                        />
                     </div>
                </div>
            );
        } else if (currentStep === 2) {
            return (
                <div className="px-4 py-3">
                    <div className="px-3">
                    <p>
                        Only sections marked as complete will be used to generate the proposal. Remember, if you want to add detail to a section, you can add some subsections by clicking the button. If you haven't added any subsections the originial question will be used.
                    </p>
                    </div>
               
            
              </div>
            );
        } 
    };


    return (
        <>
        <Button className="upload-button" onClick={handleShow} style={{minWidth: "fit-content", backgroundColor: "#ff9900", color: "black"}}>
            Generate Proposal
        </Button>
        <Modal
            show={show}
            onHide={handleClose}
            size="lg" centered
        >
             <Modal.Header className="p-6">
                <Modal.Title className="px-4">{getHeaderTitle()}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                {renderStepContent()}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleBack}>
                    {currentStep === 1 ? "Cancel" : "Back"}
                </Button>
                <Button
                    className="upload-button"
                    onClick={handleNext}
                    disabled={(currentStep === 2) || isGeneratingProposal}
                >
                    {getButtonLabel()}
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    );
};

export default GenerateProposalModal;
