import React, { useState, useEffect } from 'react';
import './FileUploader.css';
import CustomTextField from './CustomTextField';
import { displayAlert } from '../helper/Alert';

const FileUploader = ({ onFileSelect, folder, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [profileName, setProfileName] = useState(folder || 'default');
  const [isFormFilled, setIsFormFilled] = useState(false);
  const [fileToUpload, setfileToUpload] = useState(null);

  //console.log(folder);
  useEffect(() => {
    // Check if any field is either null or an empty string
    const checkFormFilled = profileName && selectedFile;
    setIsFormFilled(checkFormFilled);
  }, [profileName, selectedFile]); // Also depend on selectedFile for real-time UI update

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);

    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (isFormFilled && selectedFile && profileName) {
      // Check for spaces in the profileName first
      if (/\s/.test(profileName)) {
        displayAlert('Folder name should not contain spaces', 'warning');
        return;
      }
  
      // Then check for the validity of the profileName using regex
      if (!/^[a-zA-Z0-9_-]{3,}$/.test(profileName)) {
        displayAlert('Folder name should only contain alphanumeric characters, underscores, dashes and be at least 3 characters long', 'warning');
        return;
      }
  
      onFileSelect(selectedFile, profileName);
  
      displayAlert("Upload successful", "success");
      // Optionally, reset the form here if needed
      setSelectedFile(null);
      setProfileName(null);
      onClose(); 
    }
  };
  

  return (
    <div className={`file-uploader ${dragActive ? 'active' : ''}`}>
          <CustomTextField
            fullWidth
            label="Folder"
            variant="outlined"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            disabled={!!folder} // Disable input if folder name is provided
            className="uploader-input mb-3" // Margin bottom for spacing
          />
      <div
        className="drop-zone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          accept=".pdf"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="upload-label">
          Drag and drop your PDF here or click to select a file.
        </label>
      </div>
      {selectedFile && (
        <div>
          <h4 className='mt-3'>Selected File</h4>
          <p>{selectedFile.name}</p>
          <button onClick={handleUpload} disabled={!isFormFilled} className="upload-button">
            Upload Data
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
