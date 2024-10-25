import React, { useState, useEffect, useContext } from "react";
import { Card, Form, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { BidContext } from "../views/BidWritingStateManagerView.tsx";
import { EditorState } from "draft-js";

const SheetSelector = ({
  inputText,
  responseEditorState,
  onSelectSheet,
  isCreatingNewSheet,
  onCreateNewSheet,
  onCancelNewSheet
}: {
  inputText: string;
  responseEditorState: EditorState;
  onSelectSheet: (sheetName: string) => void;
  isCreatingNewSheet: boolean;
  onCreateNewSheet: (sheetName: string) => void;
  onCancelNewSheet: () => void;
}) => {
  const { sharedState } = useContext(BidContext);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [newSheetName, setNewSheetName] = useState("");
  const rowsPerPage = 5;
  const [totalPages, setTotalPages] = useState(0);
  const qaSheets = sharedState.documents.filter(
    (doc) => doc.type === "qa sheet"
  );

  useEffect(() => {
    setIsLoading(false);
    setTotalPages(Math.ceil(qaSheets.length / rowsPerPage));
  }, [sharedState.documents, qaSheets.length]);

  useEffect(() => {
    if (isCreatingNewSheet) {
      setNewSheetName("");
    }
  }, [isCreatingNewSheet]);

  const handleSheetSelect = (sheetName: string) => {
    if (selectedSheet === sheetName) {
      setSelectedSheet(null);
      onSelectSheet("");
    } else {
      setSelectedSheet(sheetName);
      onSelectSheet(sheetName);
    }
  };

  const handleNewSheetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSheetName.trim()) {
      onCreateNewSheet(newSheetName.trim());
    }
  };

  const handleNewSheetBlur = () => {
    setNewSheetName("");
    onCancelNewSheet();
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const renderNewSheetRow = () => {
    if (!isCreatingNewSheet) return null;

    return (
      <tr>
        <td className="sheet-name">
          <FontAwesomeIcon
            icon={faFileAlt}
            className="fa-icon"
            style={{ marginRight: "10px" }}
          />
          <input
            type="text"
            value={newSheetName}
            onChange={(e) => setNewSheetName(e.target.value)}
            onKeyPress={handleNewSheetKeyPress}
            onBlur={handleNewSheetBlur}
            placeholder="Enter sheet name"
            autoFocus
            style={{
              border: "none",
              background: "transparent",
              width: "calc(100% - 30px)",
              outline: "none",
              fontSize: "inherit",
              padding: "0",
              color: "black"
            }}
          />
        </td>
        <td className="checkbox-cell">
          <div className="custom-checkbox">
            <input
              type="checkbox"
              id="new-sheet"
              checked={false}
              disabled={true}
            />
            <label htmlFor="new-sheet"></label>
          </div>
        </td>
      </tr>
    );
  };

  const renderQASheets = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const sheetsToRender = qaSheets.slice(startIndex, endIndex);

    return sheetsToRender.map((sheet, index) => (
      <tr key={`sheet-${startIndex + index}`}>
        <td
          className="sheet-name"
          onClick={() => handleSheetSelect(sheet.name)}
        >
          <FontAwesomeIcon
            icon={faFileAlt}
            className="fa-icon"
            style={{ marginRight: "10px" }}
          />
          {sheet.name}
        </td>
        <td className="checkbox-cell">
          <div className="custom-checkbox">
            <input
              type="checkbox"
              id={`sheet-${sheet.name}`}
              checked={selectedSheet === sheet.name}
              onChange={() => handleSheetSelect(sheet.name)}
            />
            <label htmlFor={`sheet-${sheet.name}`}></label>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <Card className="select-library-card-custom mt-0 mb-0">
      <Card.Body className="select-library-card-body-content">
        <div className="select-library-card-content-wrapper">
          <p>
            Choose a Q&A Sheet to add your answer to. This sheet will appear as
            a tab in the Bid Compiler page. Your Question and Answer will be
            added to the end of the sheet so make sure you scroll to the bottom!
          </p>
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
            <table className="library-table mt-0">
              <tbody>
                {renderNewSheetRow()}
                {renderQASheets()}
              </tbody>
            </table>
          )}
          <div className="pagination-controls">
            {totalPages > 1 &&
              [...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  disabled={currentPage === i + 1}
                  className={`pagination-button ${currentPage === i + 1 ? "active" : ""}`}
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

export default SheetSelector;
