import { useRef, useState } from 'react';
import FileUploader from '../components/FileUploader';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import {displayAlert} from "../helper/Alert";

const UploadPDF = () => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || 'default');

    const [selectedFile, setSelectedFile] = useState(null);
    const [profileName, setProfileName] = useState('default');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (file) => {
        setSelectedFile(file);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('profile_name', profileName);
    
        // Check if profile name is valid
        if (!/^[a-zA-Z0-9_-]{3,}$/.test(profileName)) {
            displayAlert('Profile name should only contain alphanumeric characters and be at least 3 characters long', 'warning');
            setIsUploading(false)
            return;
        }
    
        try {
            const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/uploadfile/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${tokenRef.current}` // Adding the token in the request headers
                }
            });
            console.log(response.data);
            displayAlert("Upload successful", "success");
        } catch (error) {
            console.error('Error uploading file:', error);
            displayAlert("Failed to save", "danger");
        }
    };
    

    return (
        <div className="App">
            <h1 className='mb-4'>PDF Uploader</h1>
            <input 
                type="text" 
                placeholder="Enter Profile Name" 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
            />
            <FileUploader onFileSelect={handleFileSelect} />
        </div>
    );
}

export default withAuth(UploadPDF);
