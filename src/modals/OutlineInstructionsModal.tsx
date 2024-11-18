import { faFileUpload, faListUl, faEdit, faCloudUploadAlt, faSpinner, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useRef, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { displayAlert } from "../helper/Alert";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import { useAuthUser } from "react-auth-kit";
import SelectFolder from "../components/SelectFolder";
import { BidContext } from "../views/BidWritingStateManagerView";
import SelectTenderLibraryFile from "../components/SelectTenderLibraryFile";

const OutlineInstructionsModal = ({ show, onHide, bid_id, fetchOutline }) => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    const { sharedState, setSharedState } = useContext(BidContext);
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();
    
    const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedFolders, setSelectedFolders] = useState(sharedState.selectedFolders || []);

    const handleFileSelection = (files) => {
        console.log("Files selected in SelectTenderLibraryFile component:", files);
        setSelectedFiles(files);
    };

    const handleFolderSelection = (folders) => {
        console.log("Folders selected in SelectFolder component:", folders);
        setSelectedFolders(folders);
        setSharedState(prevState => ({
            ...prevState,
            selectedFolders: folders
        }));
    };

    const generateOutline = async () => {
        if (isGeneratingOutline) return;
        
        setIsGeneratingOutline(true);
        const formData = new FormData();
        formData.append('bid_id', bid_id);
        
        selectedFiles.forEach(file => {
            formData.append('file_names', file);
        });
        
        try {
            const response = await axios.post(
                `http${HTTP_PREFIX}://${API_URL}/generate_outline`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${tokenRef.current}`,
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            setCurrentStep(4);
            await fetchOutline();
            
        } catch (err) {
            console.error('Error generating outline:', err);
            if (err.response?.status === 404) {
                displayAlert("No documents found in the tender library. Please select documents before generating outline.", 'warning');
            } else {
                displayAlert("Failed to generate outline", 'danger');
            }
        } finally {
            setIsGeneratingOutline(false);
        }
    };

    const handleNext = async () => {
        if (currentStep === 1) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (selectedFiles.length === 0) {
                displayAlert("Please select at least one document", "warning");
                return;
            }
            setCurrentStep(3);
        } else if (currentStep === 3) {
            generateOutline();
        } else if (currentStep === 4) {
            onHide();
        }
    };

    const handleBack = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else {
            onCancel();
        }
    };

    const getButtonLabel = () => {
        switch (currentStep) {
            case 1:
                return "Next";
            case 2:
                return "Continue";
            case 3:
                return isGeneratingOutline ? (
                    <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Generating...
                    </>
                ) : "Generate";          
            case 4:
                return "Finish";   
            default:
                return "Next";
        }
    };

    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <div className="px-4 py-2">
                    <div className="mb-4">
                        <div className="d-flex align-items-center mb-3">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center" 
                                style={{ width: '32px', height: '32px', minWidth: '32px', backgroundColor: "#FF8C00" }}>1</div>
                            <div className="ms-3">
                                <h6 className="mb-1">Select Tender Questions Document</h6>
                                <p className="text-muted mb-0">
                                    First, select the tender question document as the outline will extract the questions from here
                                    <FontAwesomeIcon icon={faFileUpload} className="ms-2" />
                                </p>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center mb-3">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center" 
                                style={{ width: '32px', height: '32px', minWidth: '32px',  backgroundColor: "#FF8C00" }}>2</div>
                            <div className="ms-3">
                                <h6 className="mb-1">Select Company Library Docs</h6>
                                <p className="text-muted mb-0">
                                    Select previous bids from your company library to use as Context.
                                </p>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center" 
                                style={{ width: '32px', height: '32px', minWidth: '32px',  backgroundColor: "#FF8C00" }}>3</div>
                            <div className="ms-3">
                                <h6 className="mb-1">Generate Outline</h6>
                                <p className="text-muted mb-0">
                                Click the button below to automatically generate your proposal outline based on the tender questions.
                                    <FontAwesomeIcon icon={faEdit} className="ms-2" />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else if (currentStep === 2) {
            return (
                <div className="px-4 py-2">
                    <p>
                        Select the documents which contain the questions you need to answer in your bid. These will be used to generate the outline for your proposal.
                    </p>
                    <div className="selectfolder-container mt-0 p-0">
                        <SelectTenderLibraryFile
                            bid_id={bid_id}
                            onFileSelect={handleFileSelection}
                            initialSelectedFiles={selectedFiles}
                        />
                    </div>
                    <div 
                        className="alert alert-info" 
                        style={{
                            backgroundColor: "rgba(255, 140, 0, 0.08)", 
                            border: "1px solid #FF8C00", 
                            color: "#FF8C00"
                        }}
                    >
                        <strong>Note:</strong> Please verify your selections before proceeding. 
                        The outline will be generated based on the selected documents.
                    </div>
                </div>
            );
        } else if (currentStep === 3) {
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
        } else if (currentStep === 4) {
            return (
                <div className="px-4">
                    <h4 className="mb-3">
                        Outline Generated Successfully 
                        <FontAwesomeIcon 
                            icon={faCheck} 
                            className="text-success"
                            style={{ fontSize: '26px', marginLeft: "10px" }}
                        />
                    </h4>
                    <p className="text-muted">
                        Your outline has been created based on your tender question documents.
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h5 className="text-gray-600 mb-0">Next Steps:</h5>
                        <ol style={{padding: "12px", paddingBottom: "0px"}}>
                            <li>
                                <strong>Review Section Headings:</strong>
                                <p className="text-muted mb-2">
                                    Check that all section headings match your tender requirements. You can edit these directly in the table or add new sections by hovering over a row in the table.
                                </p>
                            </li>
                            <li>
                                <strong>Start Writing:</strong>
                                <p className="text-muted">
                                    If you want to add more detail to a section, click the edit button (pencil icon) next to any section. This will let you add specific areas you want the AI to cover in the final proposal for that section. 
                                </p>
                            </li>
                            <li>
                                <strong>Create Proposal</strong>
                                <p className="text-muted mb-2">
                                    Click the Create Proposal button to generate a proposal. Only sections which you have marked as Completed will be included in the proposal.
                                </p>
                            </li>
                        </ol>
                        <div 
                            className="alert alert-info mt-4" 
                            style={{
                                backgroundColor: "rgba(255, 140, 0, 0.08)", 
                                border: "1px solid #FF8C00", 
                                color: "#FF8C00"
                            }}
                        >
                            <strong>Tip:</strong> Keep track of section completion using the status dropdown. 
                            If you haven't marked a section as complete, it won't be included in the final proposal.
                        </div>
                    </div>
                </div>
            );
        }
    };

    const onCancel = () => {
        navigate("/bid-extractor");
    };

    const getHeaderTitle = () => {
        if (currentStep === 1) {
            return "Instructions";
        } 
        return `Step ${currentStep - 1} of 3`;
    };

    return (
        <Modal show={show} onHide={onCancel} size="lg" centered>
            <Modal.Header className="p-6">
                <Modal.Title className="px-4">{getHeaderTitle()}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-2">
                {renderStepContent()}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleBack}>
                    {currentStep === 1 ? "Cancel" : "Back"}
                </Button>
                <Button
                    className="upload-button"
                    onClick={handleNext}
                    disabled={currentStep === 2 && selectedFiles.length === 0 || isGeneratingOutline}
                >
                    {getButtonLabel()}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default OutlineInstructionsModal;