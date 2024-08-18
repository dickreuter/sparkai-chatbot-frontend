import React, { useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import { Button, Col, Row, Card, Modal, FormControl, InputGroup } from "react-bootstrap";
import UploadPDF from "../views/UploadPDF.tsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faFileAlt, faSearch, faQuestionCircle, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Menu, MenuItem } from '@mui/material';
import FileContentModal from "../components/FileContentModal.tsx";
import { displayAlert } from "../helper/Alert.tsx";
import UploadText from "../views/UploadText.tsx";

const TenderLibrary = ({ object_id }) => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [folderContents, setFolderContents] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;
  const [totalPages, setTotalPages] = useState(0);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [showPdfViewerModal, setShowPdfViewerModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const folderName = `TenderLibrary_${object_id}`;

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
    else if (action === 'text') setShowTextModal(true);
  };

  const handleDeleteFileClick = (event, unique_id, filename) => {
    event.stopPropagation(); 
    setFileToDelete({ unique_id, filename });
    setShowDeleteFileModal(true);
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_folder_filenames`,
        { collection_name: folderName },
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
     
      const filesWithIds = response.data.map(item => ({
        filename: item.meta,
        unique_id: item.unique_id
      }));
      setFolderContents(prevContents => ({
        ...prevContents,
        [folderName]: filesWithIds
      }));
      const pages = Math.ceil(response.data.length / rowsPerPage);
      setTotalPages(pages);
    } catch (error) {
      console.error("Error fetching folder filenames:", error);
    }
  };



  const deleteDocument = async (uniqueId) => {
    const formData = new FormData();
    formData.append('unique_id', uniqueId);

    try {
        await axios.post(
            `http${HTTP_PREFIX}://${API_URL}/delete_template_entry/`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${tokenRef.current}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
      fetchDocuments();
      displayAlert('Document deleted successfully', "success");
    } catch (error) {
      console.error("Error deleting document:", error);
      displayAlert('Error deleting document', "danger");
    }
  };

  const viewFile = async (fileName, uniqueId) => {

    const formData = new FormData();
    formData.append('file_name', fileName);
    formData.append("profile_name", folderName);

    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/show_file_content`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`
          },
        }
      );
  
      setModalContent(response.data);
      setCurrentFileId(uniqueId); // Set the current file ID
      setCurrentFileName(fileName); // Set the current file name
      setShowModal(true);
    } catch (error) {
      console.error('Error viewing file:', error);
    }
  };

  const viewPdfFile = async (fileName, uniqueId) => {
    const formData = new FormData();
    formData.append('file_name', fileName);
    formData.append('profile_name', folderName);
    console.log("viewpdf file");
    console.log(folderName);
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/show_file_content_pdf_format`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
          },
          responseType: 'blob',
        }
      );
       // Create a URL for the PDF file
       const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
       setPdfUrl(fileURL);
       setShowPdfViewerModal(true);
 
     } catch (error) {
       console.error('Error viewing PDF file:', error);
 
       if (error.response && error.response.status === 404) {
         // Try using the viewFile function if the file was not found as a PDF
         displayAlert('PDF file not found, try reuploading the pdf file', "danger");
         
       }
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [object_id]);

  const renderDocuments = () => {
    const documents = folderContents[folderName] || [];
    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const documentsToDisplay = documents.slice(startIdx, endIdx);

    return documentsToDisplay.map((doc, index) => (
      <tr key={index} style={{ cursor: 'pointer' }}>
        <td onClick={() => viewPdfFile(doc.filename, doc.unique_id)}>
          <FontAwesomeIcon icon={faFileAlt} className="fa-icon" /> {doc.filename}
        </td>
        <td>
          <FontAwesomeIcon
            icon={faTrash}
            className="action-icon delete-icon"
            onClick={(event) => handleDeleteFileClick(event, doc.unique_id, doc.filename)}
            style={{ cursor: 'pointer', marginRight: '15px' }}
          />
        </td>
      </tr>
    ));
  };

  const UploadPDFModal = ({ show, onHide, folder, get_collections }) => (
    <Modal 
        show={show} 
        onHide={() => { onHide(); }}
        onClick={(e) => e.stopPropagation()}
        size="lg"
    >
        <Modal.Header closeButton onClick={(e) => e.stopPropagation()}>
            <Modal.Title>PDF Uploader</Modal.Title>
        </Modal.Header>
        <Modal.Body onClick={(e) => e.stopPropagation()}>
            <UploadPDF folder={folder} get_collections={get_collections} onClose={onHide} usingTenderLibrary={true} />
        </Modal.Body>
    </Modal>
  );



  const DeleteFileModal = ({ show, onHide, onDelete, fileName }) => (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Delete File</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete the file "{fileName}"?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => onDelete()}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  return (
    <>
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Body className="tenderlibrary-card-body-content">
              <div className="library-card-content-wrapper">
                <div className="header-row mt-2">
                  <div className="lib-title">Tender Library</div>

                 

                  <Button
                    aria-controls="simple-menu"
                    aria-haspopup="true"
                    onClick={handleMenuClick}
                    className="upload-button"
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                    Upload Document
                  </Button>
                  <Menu
                    id="long-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={open}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={() => handleMenuItemClick('pdf')} style={{ fontFamily: '"ClashDisplay", sans-serif', width: "180px" }}>
                      <i className="fas fa-file-pdf" style={{ marginRight: '12px' }}></i>
                      Upload PDF
                    </MenuItem>
                   
                  </Menu>
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
            deleteDocument(fileToDelete.unique_id);
            setShowDeleteFileModal(false);
          }}
          fileName={fileToDelete ? fileToDelete.filename : ''}
        />

      <UploadPDFModal
          show={showPDFModal}
          onHide={() => setShowPDFModal(false)}
          folder={folderName}
          get_collections={fetchDocuments}
        />
      

      {showPdfViewerModal && (
        <div className="pdf-viewer-modal" onClick={() => setShowPdfViewerModal(false)}>
          <div className="pdf-viewer-modal-content" onClick={e => e.stopPropagation()}>
            <iframe src={pdfUrl} width="100%" height="600px"></iframe>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(TenderLibrary);