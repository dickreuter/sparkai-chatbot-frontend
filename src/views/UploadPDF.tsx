import React, { useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import { displayAlert } from "../helper/Alert";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudUploadAlt,
  faCheck,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import posthog from "posthog-js";

const UploadPDFComponent = ({
  folder,
  get_collections,
  onClose,
  usingTenderLibrary
}) => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const getFileMode = (fileType) => {
    if (fileType === "application/pdf") {
      return "pdf";
    } else if (
      fileType === "application/msword" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "word";
    } else if (
      fileType === "application/vnd.ms-excel" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return "excel";
    }
    return null;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    // Updated regex to allow parentheses
    const fileNameRegex = /^[\w\s()-]{3,63}$/;

    const invalidTypeFiles = newFiles.filter(
      (file) => !allowedTypes.includes(file.type)
    );
    const invalidLengthFiles = newFiles.filter((file) => {
      const fileName = file.name.split(".").slice(0, -1).join(".");
      return !fileNameRegex.test(fileName);
    });

    const validFiles = newFiles.filter(
      (file) =>
        allowedTypes.includes(file.type) &&
        fileNameRegex.test(file.name.split(".").slice(0, -1).join("."))
    );

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);

    if (validFiles.length > 0) {
      posthog.capture("pdf_upload_files_selected", {
        fileCount: validFiles.length,
        fileTypes: validFiles.map((f) => f.type),
        folder
      });
    }

    if (invalidTypeFiles.length > 0) {
      displayAlert(
        "Some files were not added due to invalid file type. Please select PDF, Word, or Excel files only.",
        "danger"
      );
      posthog.capture("pdf_upload_invalid_file_types", {
        fileCount: invalidTypeFiles.length,
        fileTypes: invalidTypeFiles.map((f) => f.type)
      });
    }

    if (invalidLengthFiles.length > 0) {
      displayAlert(
        "Some files were not added due to invalid file names. File names must be between 3-63 characters and contain only letters, numbers, spaces, underscores, or dashes.",
        "danger"
      );
    }
  };

  const uploadFile = async (file) => {
    posthog.capture("pdf_upload_started", {
      fileName: file.name,
      fileType: file.type,
      folder
    });

    const mode = getFileMode(file.type);
    if (!mode) {
      throw new Error("Unsupported file type");
    }

    const formData = new FormData();
    formData.append("file", file);

    // Only apply regex validation to folder names
    const encodedFolder = folder ? encodeURIComponent(folder) : "";
    formData.append("profile_name", encodedFolder);
    formData.append("mode", mode);

    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/uploadfile/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      posthog.capture("pdf_upload_succeeded", {
        fileName: file.name,
        fileType: file.type,
        folder
      });
      setUploadedFiles((prev) => ({ ...prev, [file.name]: true }));
      return response.data;
    } catch (error) {
      posthog.capture("pdf_upload_failed", {
        fileName: file.name,
        fileType: file.type,
        folder,
        error: error.message
      });
      console.error("Error uploading file:", error);
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
    get_collections();

    if (successCount > 0) {
      displayAlert(`Successfully uploaded ${successCount} file(s)`, "success");
      posthog.capture("pdf_upload_batch_completed", {
        successCount,
        failCount,
        totalFiles: selectedFiles.length
      });
    }
    if (failCount > 0) {
      displayAlert(`Failed to upload ${failCount} file(s)`, "danger");
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div>
      <p>
        Upload previous bids here for the AI to use as context in the Q&A
        Generator. This might take a while for large documents because we need
        to convert the documents into a format the AI can understand so sit
        tight!
      </p>
      <div
        className={`drop-zone ${dragActive ? "active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        style={{
          border: "2px dashed #cccccc",
          borderRadius: "4px",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: dragActive ? "#f0f0f0" : "white",
          transition: "all 0.3s ease"
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          multiple
        />
        <FontAwesomeIcon
          icon={faCloudUploadAlt}
          size="3x"
          style={{ marginBottom: "10px", color: "#ff7f50" }}
        />
        <p>
          Drag and drop your PDF, Word, or Excel documents here or click to
          select files
        </p>

        {selectedFiles.length > 0 && (
          <div
            style={{ textAlign: "center", maxWidth: "400px", margin: "0 auto" }}
          >
            <p>Selected files:</p>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {selectedFiles.map((file, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "5px",
                    justifyContent: "center"
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                    {file.name} ({getFileMode(file.type)})
                  </span>
                  {isUploading && !uploadedFiles[file.name] ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      style={{ color: "#ff7f50" }}
                    />
                  ) : uploadedFiles[file.name] ? (
                    <FontAwesomeIcon
                      icon={faCheck}
                      style={{ color: "green" }}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <Button
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0}
          className="upload-button"
        >
          {isUploading
            ? "Uploading..."
            : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
};

const UploadPDF = UploadPDFComponent;
export default withAuth(UploadPDF);
