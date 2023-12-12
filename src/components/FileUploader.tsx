import React, { useState } from 'react';
import './FileUploader.css';

const FileUploader = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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
      onFileSelect(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  return (
    <div className={`file-uploader ${dragActive ? 'active' : ''}`}>
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
          <h4>Selected File</h4>
          <p>{selectedFile.name}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
