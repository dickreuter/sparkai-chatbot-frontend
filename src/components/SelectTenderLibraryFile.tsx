import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import { Button, Card, Form, Spinner } from "react-bootstrap";
import {
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './SelectFolderModal.css';
import { displayAlert } from "../helper/Alert";

const SelectTenderLibraryFile = ({ bid_id, onFileSelect, initialSelectedFiles = [] }) => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [documents, setDocuments] = useState([]);
  const [documentListVersion, setDocumentListVersion] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;
  const [totalPages, setTotalPages] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState(() => {
    const initialSelection = new Set([...initialSelectedFiles]);
    return Array.from(initialSelection);
  });
  const [isLoading, setIsLoading] = useState(true);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const fetchDocuments = async () => {
    try {
      if (bid_id) {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/get_tender_library_doc_filenames`,
          { bid_id: bid_id },
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
              "Content-Type": "application/json"
            }
          }
        );
        console.log("tender library docs", response);
        setDocuments(response.data.filenames);
        const pages = Math.ceil(response.data.filenames.length / rowsPerPage);
        setTotalPages(pages);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching tender library filenames:", error);
      displayAlert("Error fetching documents", "danger");
      setIsLoading(false);
    }
  };

  const handleFileSelect = (filename) => {
    setSelectedFiles((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(filename)) {
        newSelection.delete(filename);
      } else {
        newSelection.add(filename);
      }
      const newSelectionArray = Array.from(newSelection);
      onFileSelect(newSelectionArray);
      return newSelectionArray;
    });
  };

  useEffect(() => {
    setSelectedFiles((prev) => {
      const newSelection = new Set([...initialSelectedFiles]);
      return Array.from(newSelection);
    });
  }, [initialSelectedFiles]);

  useEffect(() => {
    fetchDocuments();
  }, [bid_id, documentListVersion]);

  const renderDocuments = () => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const documentsToDisplay = documents.slice(startIdx, endIdx);

    return documentsToDisplay.map((filename, index) => (
      <tr key={index} style={{ cursor: "pointer" }}>
        <td>
          <FontAwesomeIcon icon={faFileAlt} className="fa-icon" /> {filename}
        </td>
        <td className="checkbox-cell">
          <Form.Check
            type="checkbox"
            checked={selectedFiles.includes(filename)}
            onChange={() => handleFileSelect(filename)}
          />
        </td>
      </tr>
    ));
  };

  return (
    <Card className="select-tenderlibrary-card-custom mt-0 mb-0 p-0">
      <Card.Body className="select-library-card-body-content">
        <div className="select-library-card-content-wrapper">

          {isLoading ? (
            <div className="spinner-container">
              <Spinner
                animation="border"
                role="status"
                style={{ color: "#ff7f50" }}
              >
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            
            <table className="library-table mt-0 mb-0">
              <thead>
                <tr>
                  <th>Documents</th>
                  <th>Select</th>
                </tr>
              </thead>
              <tbody>{renderDocuments()}</tbody>
            </table>
          )}

          <div className="pagination-controls">
            {totalPages > 1 &&
              [...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  disabled={currentPage === i + 1}
                  className="pagination-button"
                >
                  {i + 1}
                </button>
              ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default withAuth(SelectTenderLibraryFile);