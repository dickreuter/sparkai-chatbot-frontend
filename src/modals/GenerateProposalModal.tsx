import React, { useState, useEffect, useRef, useContext } from "react";
import { Modal, Button } from "react-bootstrap";
import SelectFolder from "../components/SelectFolder";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { faSpinner, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BidContext } from "../views/BidWritingStateManagerView";

const GenerateProposalModal = ({ bid_id, outline }) => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const navigate = useNavigate();
    const { sharedState, setSharedState } = useContext(BidContext);
    const [currentStep, setCurrentStep] = useState(1);
    const tokenRef = useRef(auth?.token || "default");
    const [show, setShow] = useState(false);
    const [isGeneratingProposal, setIsGeneratingProposal ] = useState(false);

    const incompleteSections = outline?.filter(section => section.status !== 'Completed') || [];
    const hasIncompleteSections = incompleteSections.length > 0;

    const generateProposal = async () => {
        try {
            setIsGeneratingProposal(true);
            
            const response = await axios.post(
                `http${HTTP_PREFIX}://${API_URL}/generate_proposal`,
                {
                    bid_id: bid_id,
                    extra_instructions: "",
                    datasets: sharedState.selectedFolders
                },
                {
                headers: {
                    'Authorization': `Bearer ${tokenRef.current}`,
                },
                responseType: 'blob'
                }
            );
            
            const blob = new Blob([response.data], { type: 'application/msword' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = response.headers['content-disposition']?.split('filename=')[1] || 'proposal.docx';
            document.body.appendChild(link);
            link.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            handleClose();

        } catch (err) {
            console.error('Error generating proposal:', err);
        } finally {
            setIsGeneratingProposal(false);
        }
    };

    const handleShow = () => setShow(true);
    const handleClose = () => {
        setShow(false);
        setCurrentStep(1);
    };

    const handleNext = async () => {
        if (currentStep === 1) {
                generateProposal();
        }
       
    };

    const handleBack = () => {
        if (currentStep === 2) {
            setCurrentStep(1);
        } else {
            handleClose();
        }
    };

    const getButtonLabel = () => {
        if (isGeneratingProposal) {
            return (
                <>
                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                    Processing...
                </>
            );
        }
        return "Generate Proposal";
    };

    const getHeaderTitle = () => {
        return "Generate Proposal" ; 
    };

    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <div className="p-4">
                    <div className="px-3">
                        <p>
                            Only sections marked as complete will be used to generate the proposal. The proposal will be generated as a Word document that you can then edit and format as needed.
                        </p>
                        {hasIncompleteSections && (
                            <>
                                <div className="mt-3 text-warning">
                                    <FontAwesomeIcon icon={faWarning} className="me-2" />
                                    There are {incompleteSections.length} incomplete sections:
                                </div>
                                <div 
                                    className="mt-2 border rounded p-3 bg-light" 
                                    style={{
                                        maxHeight: '200px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    <ul className="list-unstyled mb-0">
                                        {incompleteSections.map((section, index) => (
                                            <li 
                                                key={index} 
                                                className="mb-2 d-flex justify-content-between align-items-center"
                                            >
                                                <span className="fw-medium">{section.heading}</span>
                                                <FontAwesomeIcon icon={faWarning} className="me-2" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            );
        } 
    };

    return (
        <>
        <Button 
            className="upload-button" 
            onClick={handleShow} 
            style={{
                minWidth: "fit-content", 
                backgroundColor: "#ff9900", 
                color: "black"
            }}
        >
            Generate Proposal
        </Button>
        <Modal
            show={show}
            onHide={handleClose}
            size="lg" 
            centered
        >
            <Modal.Header className="p-4">
                <Modal.Title>{getHeaderTitle()}</Modal.Title>
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
                    disabled={isGeneratingProposal}
                >
                    {getButtonLabel()}
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    );
};

export default GenerateProposalModal;