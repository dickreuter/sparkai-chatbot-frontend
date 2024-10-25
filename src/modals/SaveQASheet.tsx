import React, { useContext, useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import SheetSelector from "../components/SheetSelector";
import { BidContext } from "../views/BidWritingStateManagerView.tsx";
import "./SaveQASheet.css";
import { EditorState, Modifier, SelectionState, convertToRaw } from "draft-js";

const SaveQASheet = ({
  inputText,
  responseEditorState
}: {
  inputText: string;
  responseEditorState: EditorState;
}) => {
  const [show, setShow] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const { sharedState, setSharedState } = useContext(BidContext);
  const [saveButtonState, setSaveButtonState] = useState("default");
  const [isCreatingNewSheet, setIsCreatingNewSheet] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setSelectedSheet(null);
    setIsCreatingNewSheet(false);
  };

  const createNewSheet = (sheetName: string) => {
    const newEditorState = EditorState.createEmpty();
    const newDoc = {
      name: sheetName,
      editorState: newEditorState,
      type: "qa sheet"
    };

    setSharedState((prevState) => ({
      ...prevState,
      documents: [...prevState.documents, newDoc]
    }));

    setSelectedSheet(sheetName);
    setIsCreatingNewSheet(false);
  };

  const handleSave = () => {
    if (selectedSheet) {
      addToQASheet(selectedSheet, inputText, responseEditorState);
      handleClose();
      setSaveButtonState("success");
    }
  };

  const addToQASheet = (
    sheetName: string,
    inputText: string,
    responseEditorState: EditorState
  ) => {
    setTimeout(() => {
      const currentDocIndex = sharedState.documents.findIndex(
        (doc) => doc.name === sheetName
      );
      if (currentDocIndex === -1) {
        console.error("Selected document not found");
        return;
      }
      const currentDoc = sharedState.documents[currentDocIndex];
      const currentContent = currentDoc.editorState.getCurrentContent();
      const lastBlock = currentContent.getBlockMap().last();
      const lengthOfLastBlock = lastBlock.getLength();
      const selectionState = SelectionState.createEmpty(
        lastBlock.getKey()
      ).merge({
        anchorOffset: lengthOfLastBlock,
        focusOffset: lengthOfLastBlock
      });

      const contentStateWithNewText = Modifier.insertText(
        currentContent,
        selectionState,
        `\nQuestion:\n${inputText}\n\nAnswer:\n${convertToRaw(
          responseEditorState.getCurrentContent()
        )
          .blocks.map((block) => block.text)
          .join("\n")}\n\n`
      );

      const newEditorState = EditorState.push(
        currentDoc.editorState,
        contentStateWithNewText,
        "insert-characters"
      );

      setSharedState((prevState) => ({
        ...prevState,
        documents: prevState.documents.map((doc, index) =>
          index === currentDocIndex
            ? { ...doc, editorState: newEditorState }
            : doc
        )
      }));

      console.log(`Successfully added to ${sheetName}`);
    }, 100);
  };

  const handleSelectSheet = (sheetName: string) => {
    setSelectedSheet(sheetName);
  };

  useEffect(() => {
    if (saveButtonState === "success") {
      const timer = setTimeout(() => {
        setSaveButtonState("default");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveButtonState]);

  const renderSaveButton = () => {
    switch (saveButtonState) {
      case "success":
        return (
          <Button
            className="upload-button mt-2"
            style={{ backgroundColor: "green", borderColor: "green" }}
          >
            Saved{" "}
            <FontAwesomeIcon
              icon={faCheckCircle}
              style={{ marginLeft: "5px" }}
            />
          </Button>
        );
      default:
        return (
          <Button
            className="upload-button mt-2"
            id="select-folder"
            onClick={handleShow}
          >
            Save Answer
          </Button>
        );
    }
  };

  return (
    <>
      {renderSaveButton()}
      <Modal
        show={show}
        onHide={handleClose}
        dialogClassName="select-qasheet-modal-dialog"
        contentClassName="select-qasheet-modal-content"
      >
        <Modal.Header
          style={{ paddingLeft: "25px", paddingRight: "30px" }}
          closeButton
        >
          <Modal.Title style={{ fontSize: "20px", fontWeight: "600" }}>
            Select Q&A Sheet
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="content-scaler">
            <SheetSelector
              inputText={inputText}
              responseEditorState={responseEditorState}
              onSelectSheet={handleSelectSheet}
              isCreatingNewSheet={isCreatingNewSheet}
              onCreateNewSheet={createNewSheet}
              onCancelNewSheet={() => setIsCreatingNewSheet(false)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-primary"
            onClick={() => setIsCreatingNewSheet(true)}
            style={{
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            disabled={isCreatingNewSheet}
          >
            <FontAwesomeIcon icon={faCirclePlus} />
            New Sheet
          </Button>
          <Button
            className="upload-button"
            onClick={handleSave}
            style={{ fontSize: "12px" }}
            disabled={!selectedSheet}
          >
            Add to Q&A Sheet
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SaveQASheet;
