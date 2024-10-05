import React, { useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import { Button, Col, Row, Card, Modal, FormControl, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faFileAlt, faSearch, faQuestionCircle, faPlus, faTimes, faCloudUploadAlt, faCheck, faSpinner  } from '@fortawesome/free-solid-svg-icons';
import { Menu, MenuItem } from '@mui/material';
import FileContentModal from "../components/FileContentModal.tsx";
import { displayAlert } from "../helper/Alert.tsx";
import UploadText from "../views/UploadText.tsx";
import InterrogateTenderModal from "./InterrogateTenderModal.tsx";

const TenderLibrary = ({ object_id }) => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;
  const [totalPages, setTotalPages] = useState(0);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [showPdfViewerModal, setShowPdfViewerModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [documentListVersion, setDocumentListVersion] = useState(0);
  const [showWordModal, setShowWordModal] = useState(false);
  const [wordFileContent, setWordFileContent] = useState(null);


  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleMenuItemClick = (action) => {
    handleMenuClose();
    if (action === 'pdf') setShowPDFModal(true);
  };

  const handleDeleteFileClick = (event, filename) => {
    event.stopPropagation(); 
    setFileToDelete({ filename });
    setShowDeleteFileModal(true);
  };

  const fetchDocuments = async () => {
    try {
      if (object_id) {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/get_tender_library_doc_filenames`,
          { bid_id: object_id },  // Send as JSON body
          {
            headers: {
              'Authorization': `Bearer ${tokenRef.current}`,
              'Content-Type': 'application/json',  // Changed to JSON
            }
          }
        );
        console.log("tender library docs", response);
        setDocuments(response.data.filenames);
        const pages = Math.ceil(response.data.filenames.length / rowsPerPage);
        setTotalPages(pages);
      }
     
    } catch (error) {
      console.error("Error fetching tender library filenames:", error);
      displayAlert('Error fetching documents', "danger");
    }
  };
  



  const deleteDocument = async (filename, bidId) => {
    const formData = new FormData();
    formData.append('bid_id', bidId);
    formData.append('filename', filename);
    console.log(formData);
    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/delete_file_tenderlibrary`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
     
      // Refresh the document list or update the state as needed
      fetchDocuments();
      setDocumentListVersion(prev => prev + 1);
      displayAlert('Document deleted successfully', "success");
    } catch (error) {
      console.error("Error deleting document:", error);
      if (error.response) {
        displayAlert(`Error deleting document: ${error.response.data.detail}`, "danger");
      } else if (error.request) {
        displayAlert('Error deleting document: No response from server', "danger");
      } else {
        displayAlert('Error deleting document: Request setup failed', "danger");
      }
    }
  };
 

  const viewFile = async (fileName) => {
    try {
      const formData = new FormData();
      formData.append('bid_id', object_id);
      formData.append('file_name', fileName);
  
      const fileExtension = fileName.split('.').pop().toLowerCase();
      
      if (fileExtension === 'pdf') {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/show_tenderLibrary_file_content_pdf_format`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${tokenRef.current}`,
              'Content-Type': 'multipart/form-data',
            },
            responseType: 'blob',
          }
        );
        const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        setPdfUrl(fileURL);
        setShowPdfViewerModal(true);
      } else if (['doc', 'docx'].includes(fileExtension)) {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/show_tenderLibrary_file_content_word_format`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${tokenRef.current}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setWordFileContent(response.data.content);
        setCurrentFileName(fileName);
        setShowWordModal(true);
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      displayAlert('Error viewing file', "danger");
    }
  };
  
  useEffect(() => {
    fetchDocuments();
  }, [object_id, documentListVersion]);


  
  const renderDocuments = () => {
    if (documents.length === 0) {
      return (
        <tr>
          <td colSpan="2" className="py-5">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              minHeight: '250px',
            }}>
              <div style={{
               
                width: '750px', // Fixed width
             
              }}>
                <p style={{
                  fontSize: '18px',
                  lineHeight: '1.6',
                  textAlign: 'center',
                  margin: 0,
                  wordWrap: 'break-word',
                  whiteSpace: 'normal', // Ensures text wraps
                  marginBottom: '16px'
                }}>
                  Upload documents related to this specific tender here. This is different from your previous bids and company information which belong in your Content Library.  They will also be used as context in the Q&A Generator to answer questions about this tender.</p>
                  
              </div>
            </div>
          </td>
        </tr>
      );
    }

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const documentsToDisplay = documents.slice(startIdx, endIdx);

    return documentsToDisplay.map((filename, index) => (
      <tr key={index} style={{ cursor: 'pointer' }}>
        <td onClick={() => viewFile(filename)}>
          <FontAwesomeIcon icon={faFileAlt} className="fa-icon" /> {filename}
        </td>
        <td>
          <FontAwesomeIcon
            icon={faTrash}
            className="action-icon delete-icon"
            onClick={(event) => handleDeleteFileClick(event, filename)}
            style={{ cursor: 'pointer', marginRight: '15px' }}
          />
        </td>
      </tr>
    ));
  };

  
  const UploadPDFModal = ({ show, onHide, object_id }) => {
    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({});
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
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

    const handleFiles = (newFiles) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        const validFiles = newFiles.filter(file => allowedTypes.includes(file.type));
        setFiles(prevFiles => [...prevFiles, ...validFiles]);

        if (validFiles.length !== newFiles.length) {
            displayAlert('Some files were not added. Only PDF and Word documents are allowed.', 'warning');
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            displayAlert('Please select files to upload', 'warning');
            return;
        }

        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("bid_id", object_id);

            setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));

            try {
                const response = await axios.post(
                    `http${HTTP_PREFIX}://${API_URL}/uploadfile_tenderlibrary`,
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${tokenRef.current}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                if (response.data.status === "success") {
                    successCount++;
                    setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
                } else {
                    failCount++;
                    setUploadStatus(prev => ({ ...prev, [file.name]: 'fail' }));
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                failCount++;
                setUploadStatus(prev => ({ ...prev, [file.name]: 'fail' }));
            }
        }

        setUploading(false);

        if (successCount > 0) {
            displayAlert(`Successfully uploaded ${successCount} file(s)`, 'success');
            setDocumentListVersion(prev => prev + 1);
        }
        if (failCount > 0) {
            displayAlert(`Failed to upload ${failCount} file(s)`, 'danger');
        }

        // Delay hiding the modal to allow users to see the final status
        setTimeout(() => {
            setFiles([]);
            setUploadStatus({});
            onHide();
        }, 2000);
    };

    return (
      <Modal 
        show={show} 
        onHide={onHide}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Upload Files to Tender Library</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Documents uploaded to the Tender Library will be used as context by our AI to generate compliance requirements and opportunity information for the Tender.</p>
          <div 
                    className={`drop-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                    style={{
                        border: '2px dashed #cccccc',
                        borderRadius: '4px',
                        padding: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: dragActive ? '#f0f0f0' : 'white',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        multiple
                    />
                    <FontAwesomeIcon icon={faCloudUploadAlt} size="3x" style={{ marginBottom: '10px', color: '#ff7f50' }} />
                    <p>Drag and drop your PDF or Word documents here or click to select files</p>
                    {files.length > 0 && (
                        <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                            <p>Selected files:</p>
                            <ul style={{ listStyleType: 'none', padding: 0 }}>
                                {files.map((file, index) => (
                                    <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', justifyContent: 'center' }}>
                                        <span style={{ marginRight: '10px' }}>{file.name}</span>
                                        {uploadStatus[file.name] === 'uploading' && (
                                            <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#ff7f50' }} />
                                        )}
                                        {uploadStatus[file.name] === 'success' && (
                                            <FontAwesomeIcon icon={faCheck} style={{ color: 'green' }} />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            className="upload-button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };
  

  



const DeleteFileModal = ({ show, onHide, onDelete, fileName }) => (
  <Modal show={show} onHide={onHide} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Delete File</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Are you sure you want to delete the file "{fileName}"?
    </Modal.Body>
    <Modal.Footer>
      <Button className="upload-button" onClick={onHide}>
        Cancel
      </Button>
      <Button className="upload-button" style={{backgroundColor: "red"}} onClick={() => onDelete()}>
        Delete
      </Button>
    </Modal.Footer>
  </Modal>
);
  
return (
  <>
    <Row>
      <Col md={12}>
        <Card className="mb-2">
          <Card.Body className="tenderlibrary-card-body-content">
            <div className="library-card-content-wrapper">
              <div className="header-row mt-2" id='tender-library'>
                <div className="lib-title"  >Tender Upload</div>
                <div>
                <InterrogateTenderModal bid_id={object_id}  />
                <Button
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  onClick={handleMenuClick}
                  className="upload-button"
                  style={{ marginLeft: '5px'}}
                >
                  <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px', }} />
                  Upload Document
                </Button>
                <Menu
                  id="long-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={open}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => handleMenuItemClick('pdf')} style={{ fontFamily: '"ClashDisplay", sans-serif', width: "200px" }}>
                    <i className="fas fa-file-pdf" style={{ marginRight: '12px' }}></i>
                    Upload PDF/Doc
                  </MenuItem>
                </Menu>
                </div>
                
              </div>

              <table className="library-table">
                <thead>
                  <tr>
                    <th>Documents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {renderDocuments()}
                </tbody>
              </table>
            </div>

            <div className="pagination-controls">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => paginate(i + 1)} disabled={currentPage === i + 1} className="pagination-button">
                  {i + 1}
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>

    <DeleteFileModal
      show={showDeleteFileModal}
      onHide={() => setShowDeleteFileModal(false)}
      onDelete={() => {
        deleteDocument(fileToDelete.filename, object_id);
        setShowDeleteFileModal(false);
      }}
      fileName={fileToDelete ? fileToDelete.filename : ''}
    />

    <UploadPDFModal
      show={showPDFModal}
      onHide={() => setShowPDFModal(false)}
      object_id={object_id}
    />

{showPdfViewerModal && (
        <div className="pdf-viewer-modal" onClick={() => setShowPdfViewerModal(false)}>
          <div className="pdf-viewer-modal-content" onClick={e => e.stopPropagation()}>
            <iframe src={pdfUrl} width="100%" height="600px"></iframe>
          </div>
        </div>
      )}

      {showWordModal && (
        <Modal show={showWordModal} onHide={() => setShowWordModal(false)} size="lg" style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
          <Modal.Header closeButton>
          <Modal.Title style={{ textAlign: 'center' }}>
              File Content
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ height: '600px'}}>
          <pre style={{
                width: '100%',
                height: '100%',
                padding: '20px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowX: 'hidden',
                borderRadius: '4px',
                border: '1px solid #ccc'
            }}>
              {wordFileContent}
            </pre>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
}

export default withAuth(TenderLibrary);