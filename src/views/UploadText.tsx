import axios from "axios";
import { useRef, useState, useEffect } from "react";
import { useAuthUser } from "react-auth-kit";
import { API_URL, HTTP_PREFIX, placeholder_upload } from "../helper/Constants";
import withAuth from "../routes/withAuth";
import "./Upload.css";
import { displayAlert } from "../helper/Alert";
import CustomTextField from "../components/CustomTextField";
import TextField from '@mui/material/TextField';
import handleGAEvent from "../utilities/handleGAEvent";

const UploadText = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [text, setText] = useState(null);


  
  const [profileName, setProfileName] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [textFormat, setTextFormat] = useState("plain");
  const [isUploading, setIsUploading] = useState(false);
  const [isFormFilled, setIsFormFilled] = useState(false); // 

  useEffect(() => {
    // Check if any field is either null or an empty string
    const checkFormFilled = profileName && fileName && text;
    setIsFormFilled(checkFormFilled);
  }, [profileName, fileName, text]); // React to changes in these states
  

  const handleTextSubmit = async () => {
    const formData = new FormData();
    setIsUploading(true);
    formData.append("text", "plain");
    formData.append("filename", fileName);
    formData.append("profile_name", profileName);
    formData.append("mode", textFormat);

    if (!/^[a-zA-Z0-9_-]{3,}$/.test(profileName)) {
      displayAlert(
        "Profile name should only contain alphanumeric characters and be at least 3 characters long",
        "warning"
      );
      setIsUploading(false);
      return;
    }

    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/uploadtext/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            // The 'Content-Type': 'multipart/form-data' header will be set automatically by Axios for FormData
          },
        }
      );

      displayAlert("Upload successful", "success");
      handleGAEvent('Library', 'Text Upload', 'Upload Text Button');
    } catch (error) {
      console.error("Error saving strategy:", error);
      displayAlert("Failed to save", "danger");
    } finally {
      setIsUploading(false); // Set isUploading to false when the upload ends
    }
  };

  // ...

  
  return (
    <div className="App" style={{ textAlign: 'left' }}>
      <div className="input-options-container mt-3">
        <CustomTextField
          fullWidth
          label="Folder"
          variant="outlined"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
        <CustomTextField
          fullWidth
          label="File name"
          variant="outlined"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
        <TextField
          fullWidth
          label="Paste Bid Material Here.."
          variant="outlined"
          multiline
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': { fontFamily: '"ClashDisplay", sans-serif' },
            '& .MuiInputLabel-root': { fontFamily: '"ClashDisplay", sans-serif' },
          }}
        />
        <button
          onClick={handleTextSubmit}
          disabled={!isFormFilled} // Button is disabled if not all fields are filled
          className="upload-button mb-4"
        >
          Upload Data
        </button>
      </div>
    </div>
  );
};

export default withAuth(UploadText);
