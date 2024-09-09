import React, { useRef, useState } from 'react';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import { displayAlert } from "../helper/Alert";
import { Button, ProgressBar } from 'react-bootstrap';

const UploadPDF = ({ folder, get_collections, onClose, usingTenderLibrary }) => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || 'default');

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append("profile_name", folder || '');

        try {
            const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/uploadfile/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${tokenRef.current}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            displayAlert("No files selected", "warning");
            return;
        }

        setIsUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (const file of selectedFiles) {
            try {
                await uploadFile(file);
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        setIsUploading(false);
        setSelectedFiles([]);
        setUploadProgress({});
        get_collections();

        if (successCount > 0) {
            displayAlert(`Successfully uploaded ${successCount} file(s)`, "success");
        }
        if (failCount > 0) {
            displayAlert(`Failed to upload ${failCount} file(s)`, "danger");
        }
    };

    return (
        <div className="upload-pdf-container">
            <div
                className="drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <p>Drag and drop PDF or DOC files here, or click to select files</p>
                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx"
                />
            </div>
            {selectedFiles.length > 0 && (
                <div className="selected-files">
                    <h4>Selected Files: {selectedFiles.length}</h4>
                    <ul>
                        {selectedFiles.map((file, index) => (
                            <li key={index}>
                                {file.name}
                                {uploadProgress[file.name] && (
                                    <ProgressBar now={uploadProgress[file.name]} label={`${uploadProgress[file.name]}%`} />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <Button
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="upload-button mt-3"
            >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
        </div>
    );
};

export default withAuth(UploadPDF);
