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
import { LinearProgress, Typography, Box } from '@mui/material';

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

    const [progress, setProgress] = useState(0);
    const progressInterval = useRef(null);

    
    function LinearProgressWithLabel(props) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress 
            variant="determinate" 
            {...props} 
            sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: '#ffd699',
                '& .MuiLinearProgress-bar': {
                backgroundColor: '#ff9900'
                }
            }}
            />
        </Box>
        <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
            {`${Math.round(props.value)}%`}
            </Typography>
        </Box>
        </Box>
    );
    }

    const startProgressBar = () => {
        const duration = 90000; // 1:30 minutes in ms
        const interval = 100; // Update every 100ms
        const steps = duration / interval;
        const increment = 98 / steps; // Go up to 98% until complete
        
        let currentProgress = 0;
        progressInterval.current = setInterval(() => {
            currentProgress += increment;
            if (currentProgress >= 98) {
                clearInterval(progressInterval.current);
                // Only complete if proposal is done
                if (!isGeneratingProposal) {
                    setProgress(100);
                } else {
                    setProgress(98);
                }
            } else {
                setProgress(currentProgress);
            }
        }, interval);
    };

    const generateProposal = async () => {
        try {
            setIsGeneratingProposal(true);
            startProgressBar();

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
            setProgress(60);
            handleClose();
            

        } catch (err) {
            console.error('Error generating proposal:', err);
        } finally {
            clearInterval(progressInterval.current);
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
                <div className="px-2 py-4">
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
                        {isGeneratingProposal && (
                            <div className="mt-4">
                                 <LinearProgressWithLabel value={progress} />
                            </div>
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