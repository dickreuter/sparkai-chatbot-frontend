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
      onSaveSelectedFolders(selectedFolders);
      setShow(false);
  };
  const handleFolderSelection = (folders) => {
      console.log('Folders selected in SelectFolder component:', folders);
      setSelectedFolders(folders);
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
              <Modal.Footer>
                  <Button className='upload-button' onClick={handleClose} style={{fontSize: "12px"}}>
                      Save Changes
                  </Button>
              </Modal.Footer>
          </Modal>
      <style type="text/css">
        {`
          .select-folder-modal-dialog {
            max-width: 75vw;
            width: 90vw;
           
            marigin-bottom: 0;
          }
          .select-folder-modal-content {
            max-height: 85vh;
            overflow-y: auto;
             marigin-bottom: 0;
          }
          @media (min-width: 2000px) {
            .select-folder-modal-dialog {
              max-width: 2000px;
              width: 2000px;
            }
          }
          .content-scaler {
            transform: scale(0.8);
            transform-origin: top left;
            width: 125%; /* 1 / 0.8 = 1.25, so 125% */
            height: 125%;
          }
          .modal-body {
            overflow: hidden;
            padding-bottom: 0;
          }

           .modal-header .btn-close {
            padding: 0.5rem 0.5rem;
            margin: -0.5rem -0.5rem -0.5rem auto;
            font-size: 0.8rem;
          }
        `}
      </style>
    </>
  );
};

export default SelectFolderModal;