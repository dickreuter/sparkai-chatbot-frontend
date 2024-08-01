import { faPencil, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

const FileContentModal = ({ showModal, setShowModal, modalContent, onSave, documentId, fileName, folderName, onViewPdf }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableContent, setEditableContent] = useState(modalContent);
  
    useEffect(() => {
      setEditableContent(modalContent);
    }, [modalContent]);
  
    const handleEditClick = () => {
      setIsEditing(true);
    };
  
    const handleSaveClick = () => {
      onSave(editableContent);
      setIsEditing(false);
    };
  
    const handleCancelClick = () => {
      setIsEditing(false);
      setEditableContent(modalContent);
    };
  
    const handleViewPdfClick = () => {
      onViewPdf(fileName, folderName);
      setShowModal(false); // Close the FileContentModal
    };
  
    return (
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ flex: '1 1 auto' }}>
            <Modal.Title style={{ textAlign: 'center' }}>
              File Content
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={{ height: '600px'}}>
          {isEditing ? (
            <textarea
              style={{
                width: '100%',
                height: '100%',
                padding: '20px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowX: 'hidden',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: 'white',
                color: 'black'
              }}
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
            />
          ) : (
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
              {modalContent}
            </pre>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isEditing ? (
            <>
              <Button className='upload-button' onClick={handleCancelClick}>
                Cancel
              </Button>
              <Button className='upload-button' onClick={handleSaveClick}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button className='upload-button' onClick={handleEditClick}>
                Edit
              </Button>
              {fileName && fileName.endsWith('.pdf') && (
                <Button className='upload-button' onClick={handleViewPdfClick}>
                  View PDF Uploaded
                </Button>
              )}
            </>
          )}
        </Modal.Footer>
      </Modal>
    );
  };
  
  export default FileContentModal;