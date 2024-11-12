import { faFileUpload, faListUl, faEdit, faCloudUploadAlt, faSpinner, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { displayAlert } from "../helper/Alert";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import { useAuthUser } from "react-auth-kit";

const OutlineInstructionsModal = ({ show, onHide, bid_id, fetchOutline }) => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    // State for managing files and their contents
    const [files, setFiles] = useState([]);
    const [fileContents, setFileContents] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

    const generateOutline = async () => {
        // Prevent multiple generations
        if (isGeneratingOutline) return;
        
        setIsGeneratingOutline(true);
        const formData = new FormData();
        formData.append('bid_id', bid_id);
        
        const successfulFiles = files.filter(file => uploadStatus[file.name] === "success");
        successfulFiles.forEach(file => {
            formData.append('file_names', file.name);
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
                displayAlert("No documents found in the tender library. Please upload documents before generating outline.", 'warning');
            } else {
                displayAlert("Failed to generate outline", 'danger');
            }
        } finally {
            setIsGeneratingOutline(false);
            
        }
    };
    
    

    const getFileMode = (fileType) => {
        if (fileType === 'application/pdf') {
            return 'pdf';
        } else if (fileType === 'application/msword' || 
                   fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return 'word';
        } else if (fileType === 'application/vnd.ms-excel' || 
                   fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            return 'excel';
        }
        return null;
    };

    const readFileContent = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFiles = async (newFiles) => {
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];

        const validFiles = newFiles.filter((file) => {
            const isAllowedType = allowedTypes.includes(file.type);
            const mode = getFileMode(file.type);
            return isAllowedType && mode !== null;
        });

        setFiles((prevFiles) => [...prevFiles, ...validFiles]);

        // Read and store file contents
        for (const file of validFiles) {
            const content = await readFileContent(file);
            setFileContents(prev => ({
                ...prev,
                [file.name]: {
                    content,
                    type: file.type,
                    mode: getFileMode(file.type)
                }
            }));
        }

        if (validFiles.length !== newFiles.length) {
            displayAlert(
                "Some files were not added. Only PDF, Word, and Excel documents are allowed.",
                "warning"
            );
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            displayAlert("Please select files to upload", "warning");
            return false;
        }
    
        setUploading(true);
        let successCount = 0;
        let failCount = 0;
        console.log(files);
        console.log("uploading files");
        for (const file of files) {
            const mode = getFileMode(file.type);
            if (!mode) {
                failCount++;
                setUploadStatus((prev) => ({ ...prev, [file.name]: "fail" }));
                continue;
            }
    
            setUploadStatus((prev) => ({ ...prev, [file.name]: "uploading" }));
            const formData = new FormData();
            formData.append("file", file);
            formData.append("bid_id", bid_id);
            formData.append("mode", mode);
    
            // Add file content if available
            if (fileContents[file.name]) {
                formData.append("fileContent", fileContents[file.name].content);
            }
    
            try {
                const response = await axios.post(
                    `http${HTTP_PREFIX}://${API_URL}/uploadfile_tenderlibrary`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${tokenRef.current}`,
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );
    
                if (response.data.status === "success") {
                    successCount++;
                    setUploadStatus((prev) => ({ ...prev, [file.name]: "success" }));
                } else {
                    failCount++;
                    setUploadStatus((prev) => ({ ...prev, [file.name]: "fail" }));
                    console.error("Upload failed:", response.data.message || "Unknown error");
                }
            } catch (error) {
                console.error("Error uploading file:", error);
                failCount++;
                setUploadStatus((prev) => ({ ...prev, [file.name]: "fail" }));
                displayAlert(
                    error.response?.data?.message || "Failed to upload file",
                    "danger"
                );
            }
        }
    
        setUploading(false);
    
        if (successCount > 0) {
            
            if (typeof setDocumentListVersion === 'function') {
                setDocumentListVersion((prev) => prev + 1);
            }
        }
    
        if (failCount > 0) {
            displayAlert(`Failed to upload ${failCount} file(s)`, "danger");
        }
    
        // Return success status for step navigation
        const isSuccessful = successCount > 0;
        return isSuccessful;
    };

    const handleRemoveFile = (indexToRemove) => {
        const fileToRemove = files[indexToRemove];
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        setUploadStatus(prevStatus => {
            const newStatus = { ...prevStatus };
            delete newStatus[fileToRemove.name];
            return newStatus;
        });
        setFileContents(prevContents => {
            const newContents = { ...prevContents };
            delete newContents[fileToRemove.name];
            return newContents;
        });
    };

    const handleNext = async () => {
        if (currentStep === 1) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            const uploadSuccessful = await handleUpload();
            if (uploadSuccessful) {
                setCurrentStep(3);
            }
        } else if (currentStep === 3) {
            // On the confirmation step, let's trigger the outline generation
            generateOutline();
        } else if (currentStep === 4) {
            onHide(); // Close the modal on the final step
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
                return uploading ? (
                    <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Processing...
                    </>
                ) : "Continue";
            case 3:
                return isGeneratingOutline ?(
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


    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
        } else if (e.type === "dragleave") {
          setDragActive(false);
        }
      };
      
  
      const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(Array.from(e.dataTransfer.files));
        }
      };
  
      const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFiles(Array.from(e.target.files));
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
                                <h6 className="mb-1">Upload Tender Questions Document</h6>
                                <p className="text-muted mb-0">
                                    First, upload the correct tender question document as the outline will extract the questions from here
                                    <FontAwesomeIcon icon={faFileUpload} className="ms-2" />
                                </p>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center mb-3">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center" 
                                style={{ width: '32px', height: '32px', minWidth: '32px',  backgroundColor: "#FF8C00" }}>2</div>
                            <div className="ms-3">
                                <h6 className="mb-1">Generate Outline</h6>
                                <p className="text-muted mb-0">
                                    Click the button below to automatically generate your proposal outline based on the tender questions.
                                </p>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center" 
                                style={{ width: '32px', height: '32px', minWidth: '32px',  backgroundColor: "#FF8C00" }}>3</div>
                            <div className="ms-3">
                                <h6 className="mb-1">Review and Customise</h6>
                                <p className="text-muted mb-0">
                                    Once generated, you can modify section headings, weightings, and assign reviewers
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
                The documents chosen here will be used to generate the outline for your proposal. Make sure you only upload the documents which contain the questions you need to answer in your bid!
              </p>
              <div
                className={`drop-zone ${dragActive ? "active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                style={{
                  border: "2px dashed #cccccc",
                  borderRadius: "4px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: dragActive ? "#f0f0f0" : "white",
                  transition: "all 0.3s ease"
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                  multiple
                />
                <FontAwesomeIcon
                  icon={faCloudUploadAlt}
                  size="3x"
                  style={{ marginBottom: "10px", color: "#ff7f50" }}
                />
                <p>
                  Drag and drop your PDF, Word, or Excel documents here or click to select
                  files
                </p>
                {files.length > 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      maxWidth: "400px",
                      margin: "0 auto"
                    }}
                  >
                    <p>Selected files:</p>
                    <ul style={{ listStyleType: "none", padding: 0 }}>
                      {files.map((file, index) => (
                        <li
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "5px",
                            justifyContent: "center"
                          }}
                        >
                          <span style={{ marginRight: "10px" }}>
                            {file.name} ({getFileMode(file.type)})
                          </span>
                          {uploadStatus[file.name] === "uploading" && (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              spin
                              style={{ color: "#ff7f50" }}
                            />
                          )}
                          {uploadStatus[file.name] === "success" && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              style={{ color: "green" }}
                            />
                          )}
                          {(uploadStatus[file.name] === "fail" || !uploadStatus[file.name]) && (
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-danger cursor-pointer"
                                onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(index);
                            }}
                                style={{ cursor: 'pointer' }}
                            />
                            )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              </div>
            );
        } 
        else if (currentStep === 3) {
            const successfulFiles = files.filter(file => uploadStatus[file.name] === "success");
            
            return (
                <div className="p-4">
                    <div className="bg-gray-50 rounded-lg p-6 mb-4">
                        <div className="mb-4">
                            <h5 className="text-gray-600 mb-2">Selected Documents</h5>
                            {successfulFiles.length > 0 ? (
                                <div className="space-y-2">
                                    {successfulFiles.map((file, index) => (
                                        <div 
                                            key={index} 
                                            className="flex items-center p-3 border rounded-lg bg-white"
                                        >
                                            
                                            <div>
                                                <p className="font-medium mb-0">{file.name}</p>
                                                <p className="text-sm text-gray-500 mb-0">
                                                    Type: {getFileMode(file.type).toUpperCase()}
                                                </p>
                                            </div>
                                            <FontAwesomeIcon 
                                                icon={faCheck} 
                                                className="text-green-500 ml-auto"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No documents have been successfully uploaded.</p>
                            )}
                        </div>
                    </div>
        
                    <div 
                        className="alert alert-info" 
                        style={{
                            backgroundColor: "rgba(255, 140, 0, 0.08)", 
                            border: "1px solid #FF8C00", 
                            color: "#FF8C00"
                        }}
                    >
                        <strong>Note:</strong> Please verify the document details before proceeding. 
                        The outline will be generated based on these documents.
                    </div>
                </div>
            );
        }
        else if (currentStep === 4) {
            return (
               
                <div className="px-4">
                        <h4 className="mb-3">Outline Generated Successfully 
                            <FontAwesomeIcon 
                                icon={faCheck} 
                                className="text-success"
                                style={{ fontSize: '26px', marginLeft: "10px" }}
                            /></h4>
                        <p className="text-muted">
                            Your outline has been created based on you tender question documents.
                        </p>
                
        
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h5 className="text-gray-600 mb-0">Next Steps:</h5>
                        <ol style={{padding: "12px", paddingBottom: "0px"}}>
                            <li>
                                <strong>Review Section Headings:</strong>
                                <p className="text-muted mb-2">
                                    Check that all section headings match your tender requirements. You can edit these directly in the table or add new sections by hoving over a row in the table.
                                </p>
                            </li>
                            <li>
                                <strong>Start Writing:</strong>
                                <p className="text-muted">
                                    If you want to add more detail to a section, click the edit button (pencil icon) next to any section. This will let you add specfiic areas you want the AI to cover in the final proposal for that section. 
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
        navigate("/bid-extractor");  // Use the navigate function from the hook
    };


    const getHeaderTitle = () => {
        if (currentStep === 1) {
            return "Instructions";
        } 
        return `Step ${currentStep - 1} of 3`;  // Changed from 2 to 3 to account for all steps
    };



    return (
        <Modal show={show} onHide={onCancel} size="lg" centered>
            <Modal.Header className="p-6">
                <Modal.Title className="px-4">{getHeaderTitle()}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-6">
                {renderStepContent()}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleBack}>
                    {currentStep === 1 ? "Cancel" : "Back"}
                </Button>
                <Button
                    className="upload-button"
                    onClick={handleNext}
                    disabled={(currentStep === 2 && files.length === 0) || isGeneratingOutline}
                >
                    {getButtonLabel()}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default OutlineInstructionsModal;