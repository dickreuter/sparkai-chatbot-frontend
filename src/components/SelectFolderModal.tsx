import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import SelectFolder from './SelectFolder';
import "./SelectFolderModal.css";

const SelectFolderModal = ({ onSaveSelectedFolders, initialSelectedFolders = [] }) => {
  const [show, setShow] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState(() => {
    const initialSelection = new Set(initialSelectedFolders);
    return Array.from(initialSelection);
  });


  const handleShow = () => setShow(true);
  const handleClose = () => {
      console.log('Closing modal. Selected folders:', selectedFolders);
      
      setShow(false);
  };
  const handleFolderSelection = (folders) => {
      console.log('Folders selected in SelectFolder component:', folders);
      setSelectedFolders(folders);
      onSaveSelectedFolders(selectedFolders);
  };
  useEffect(() => {
      console.log('selectedFolders state updated:', selectedFolders);
  }, [selectedFolders]);

  return (
      <>
          <Button className='upload-button' id='select-folder' onClick={handleShow}>
              Select Folders
          </Button>
          <Modal
              show={show}
              onHide={handleClose}
              dialogClassName="select-folder-modal-dialog"
              contentClassName="select-folder-modal-content"
          >
              <Modal.Header style={{paddingLeft: "25px", paddingRight: "30px"}} closeButton>
                  <Modal.Title style={{fontSize: "20px", fontWeight: "600"}}>Select Folders to Use as Context</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <div className="content-scaler">
                      <SelectFolder
                          onFolderSelect={handleFolderSelection}
                          initialSelectedFolders={selectedFolders}
                      />
                  </div>
              </Modal.Body>
          </Modal>
     
    </>
  );
};

export default SelectFolderModal;