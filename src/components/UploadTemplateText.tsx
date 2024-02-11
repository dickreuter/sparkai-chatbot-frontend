import axios from "axios";
import {useRef, useState} from "react";
import {useAuthUser} from "react-auth-kit";
import {API_URL, HTTP_PREFIX} from "../helper/Constants.tsx";
import withAuth from "../routes/withAuth.tsx";
import "../views/Upload.css";
import {displayAlert} from "../helper/Alert.tsx";

const UploadTemplateText = () => {
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
        formData.append("mode", 'template-text');

        if (!/^[a-zA-Z0-9_-\s]{3,}$/.test(profileName)) {
            displayAlert(
                "Headline name should only contain alphanumeric characters and be at least 3 characters long",
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
            console.error("Error saving:", error);
            displayAlert("Failed to save", "danger");
        } finally {
            setIsUploading(false); // Set isUploading to false when the upload ends
        }
    };

    return (
        <div className="App">
            <h1>Template Uploader</h1>

            <div>
                Template Headline:
                <input
                    type="text"
                    placeholder=""
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="mt-3 mb-3"
                />
            </div>
            <div>
        <textarea
            placeholder=""
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
                Upload Text Template
            </button>
        </div>
    );
};

export default withAuth(UploadTemplateText);
