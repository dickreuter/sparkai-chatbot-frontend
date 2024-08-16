import { useRef, useState } from 'react';
import FileUploader from '../components/FileUploader';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import {displayAlert} from "../helper/Alert";


const UploadPDF = ({folder, get_collections, onClose, usingTenderLibrary}) => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || 'default');

    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (file, profileName) => {
        setSelectedFile(file);
        const trimmedProfileName = profileName.trim(); // Remove leading and trailing spaces
        const formattedProfileName = trimmedProfileName.replace(/\s+/g, '_');
        const formData = new FormData();
        formData.append('file', file);
        formData.append("profile_name", formattedProfileName);
        
        // Check if profile name is valid
        if (!/^[a-zA-Z0-9_-]{3,}$/.test(formattedProfileName)) {
            displayAlert('Folder name should only contain alphanumeric characters, underscores, dashes and be at least 3 characters long', 'warning');
            setIsUploading(false);
            return;
            }


        try {
            const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/uploadfile/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${tokenRef.current}` // Adding the token in the request headers
                }
            });
            //console.log(response.data);
            displayAlert("Upload successful", "success");
            get_collections();

        } catch (error) {
            console.error('Error uploading file:', error);
            displayAlert("Failed to save", "danger");
        }
    };


    return (
        <div className="App">

            <FileUploader onFileSelect={handleFileSelect} folder={folder} onClose={onClose} usingTenderLibrary={usingTenderLibrary}/>
        </div>
    );
}

export default withAuth(UploadPDF);
