import { faPencil, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";

const FileContentModal = ({
  showModal,
  setShowModal,
  modalContent,
  onSave,
  documentId,
  fileName,
  folderName,
  onViewPdf,
  isLoading
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(modalContent);
  console.log("isloading", isLoading);

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
      <Modal.Header
        className="px-4"
        style={{
          display: "flex",
          justifyContent: "center",
          textAlign: "center"
        }}
      >
        <Modal.Title>File Content</Modal.Title>

        <button
          className="close-button ms-auto"
          onClick={() => setShowModal(false)}
        >
          ×
        </button>
      </Modal.Header>
      <Modal.Body
        style={{ height: "500px", position: "relative" }}
        className="px-4 py-4"
      >
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 1000
            }}
          >
            <Spinner
              animation="border"
              style={{
                width: "2rem",
                height: "2rem",
                color: "black"
              }}
            />
          </div>
        )}
        {isEditing ? (
          <textarea
            style={{
              width: "100%",
              height: "100%",
              padding: "20px",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              overflowX: "hidden",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "white",
              color: "black"
            }}
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
          />
        ) : (
          <pre
            style={{
              width: "100%",
              height: "100%",
              padding: "20px",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              overflowX: "hidden",
              borderRadius: "4px",
              border: "1px solid #ccc"
            }}
          >
            {modalContent}
          </pre>
        )}
      </Modal.Body>
      <Modal.Footer>
        {isEditing ? (
          <>
            <Button className="upload-button" onClick={handleCancelClick}>
              Cancel
            </Button>
            <Button className="upload-button" onClick={handleSaveClick}>
              Save Changes
            </Button>
          </>
        ) : (
          <>
            {fileName && fileName.endsWith(".pdf") && (
              <Button className="upload-button" onClick={handleViewPdfClick}>
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
