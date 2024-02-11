import axios from "axios";
import { useRef, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { API_URL, HTTP_PREFIX, placeholder_upload } from "../helper/Constants";
import withAuth from "../routes/withAuth";
import "./Upload.css";
import { displayAlert } from "../helper/Alert";

const UploadText = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [text, setText] = useState("");
  const [profileName, setProfileName] = useState("default");
  const [textFormat, setTextFormat] = useState("plain");
  const [isUploading, setIsUploading] = useState(false);

  const handleTextSubmit = async () => {
    const formData = new FormData();
    setIsUploading(true);
    formData.append("text", text);
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
    } catch (error) {
      console.error("Error saving strategy:", error);
      displayAlert("Failed to save", "danger");
    } finally {
      setIsUploading(false); // Set isUploading to false when the upload ends
    }
  };

  // ...

  return (
    <div className="App">
      <h1>Text Uploader</h1>
      <div>
        Text format:
        <select
          className="mx-3 my-3"
          value={textFormat}
          onChange={(e) => setTextFormat(e.target.value)}
        >
          <option value="plain">Plain Text</option>
          <option value="feedback">Feedback</option>
          <option value="qa">Question / Answer Pairs</option>
        </select>
      </div>
      <div>
        Profile name:
        <input
         className="mx-3 mb-3"
          type="text"
          placeholder="Enter Profile Name"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
      </div>
      <div>
        <textarea
          placeholder={placeholder_upload}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-2"
        />
      </div>
      <button
        onClick={handleTextSubmit}
        disabled={isUploading}
        className={isUploading ? "btn-disabled" : ""}
      >
        Upload Data
      </button>
    </div>
  );
};

export default withAuth(UploadText);
