import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import Tooltip from "@mui/material/Tooltip"; // Correct import for Tooltip
import axios from "axios";
import { Document, Packer, Paragraph } from "docx";
import { ContentState, EditorState, Modifier } from "draft-js";
import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { Editor } from "react-draft-wysiwyg";
import "../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { displayAlert } from "../helper/Alert";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import withAuth from "../routes/withAuth";
import "./Chatbot.css";

const Chatbot = () => {
  const [folderContents, setFolderContents] = useState({});

  const [selectedFile, setSelectedFile] = useState(null);
  const [profileName, setProfileName] = useState("default");
  const [isUploading, setIsUploading] = useState(false);
  const [activeDragFolder, setActiveDragFolder] = useState(null);

  const [choice, setChoice] = useState("2");
  const [broadness, setBroadness] = useState("1");
  const [dataset, setDataset] = useState("default");
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [backgroundInfo, setBackgroundInfo] = useState("");
  const [availableCollections, setAvailableCollections] = useState<string[]>(
    []
  );
  const [editorState, setEditorState] = useState(
    EditorState.createWithContent(ContentState.createFromText(""))
  );

  const [feedback, setFeedback] = useState("");
  const [questionAsked, setQuestionAsked] = useState(false);
  const [apiChoices, setApiChoices] = useState([]);
  const [selectedChoices, setSelectedChoices] = useState([]);

  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const email = auth?.email || "default";

  const onEditorStateChange = (editorState) => {
    setEditorState(editorState);
  };

  const downloadDocument = () => {
    const doc = new Document();

    // Splitting the text into paragraphs
    const paragraphs = editorState
      .getCurrentContent()
      .getPlainText()
      .split("\n")
      .map((text) => new Paragraph(text));
    doc.addSection({ children: paragraphs });

    // Used to download the document
    Packer.toBlob(doc).then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "document.docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const appendToEditor = () => {
    const currentContent = editorState.getCurrentContent();
    const currentContentBlock = currentContent.getBlockMap().last();

    const lengthOfLastBlock = currentContentBlock.getLength();
    // If there is already text, add a newline before appending
    const modifiedText = lengthOfLastBlock > 0 ? `\n${response}` : response;

    const selectionState = editorState.getSelection().merge({
      anchorKey: currentContentBlock.getKey(),
      anchorOffset: lengthOfLastBlock,
      focusKey: currentContentBlock.getKey(),
      focusOffset: lengthOfLastBlock,
    });

    const newContentState = Modifier.insertText(
      currentContent,
      selectionState,
      modifiedText
    );

    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "insert-characters"
    );

    setEditorState(newEditorState);
  };

  const countWords = (str) => {
    return str.split(/\s+/).filter(Boolean).length;
  };

  useEffect(() => {
    let interval = null;
    if (isLoading && startTime) {
      interval = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000); // Update elapsed time in seconds
      }, 100);
    } else if (!isLoading) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  const get_collections = () => {
    axios
      .post(
        `http${HTTP_PREFIX}://${API_URL}/get_collections`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      )
      .then((res) => {
        setAvailableCollections(res.data.collections || []);
        // console.log('Available collections:', res.data.collections);
      })
      .catch((error) => {
        console.error("Error fetching strategies:", error);
      });
  };
  useEffect(() => {
    get_collections();
  }, []);

  const handleAddNewFolderClick = () => {
    const newFolderName = window.prompt("Enter the name for the new folder:");
    if (newFolderName) {
      addNewFolder(newFolderName);
    }
  };

  const addNewFolder = async (folderName) => {
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/add_folder`,
        { folder_name: folderName },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );
      // Handle successful response, update folder list
      get_collections(); // Assuming this fetches the updated list of collections
    } catch (error) {
      console.error("Error adding new folder:", error);
      // Handle error
    }
  };

  const handleTextHighlight = async () => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      setInputText(selectedText);
      setChoice("1"); // Set choice to Copilot

      // Wait for state update before sending the question
      await new Promise((resolve) => setTimeout(resolve, 0));
      sendQuestion(); // Call sendQuestion function to simulate submit
    }
  };

  const handleDatasetFileDrop = async (collectionName, file) => {
    // This function will handle the file drop on a specific dataset folder
    // You can call handleFileSelect here with the dataset name and file
    handleFileSelect(file, collectionName); // Adjust based on your implementation
  };

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("profile_name", profileName);

    // Check if profile name is valid
    if (!/^[a-zA-Z0-9_-]{3,}$/.test(profileName)) {
      displayAlert(
        "Profile name should only contain alphanumeric characters and be at least 3 characters long",
        "warning"
      );
      setIsUploading(false);
      return;
    }

    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/uploadfile/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${tokenRef.current}`, // Adding the token in the request headers
          },
        }
      );
      console.log(response.data);
      displayAlert("Upload successful", "success");
    } catch (error) {
      console.error("Error uploading file:", error);
      displayAlert("Failed to save", "danger");
    }
  };

  const sendQuestion = async () => {
    setQuestionAsked(true);
    setResponse("");
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: choice === "3" ? "3a" : choice,
          broadness: broadness,
          input_text: inputText,
          extra_instructions: backgroundInfo,
          dataset,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );
      if (choice != "3") {
        setResponse(result.data);
      }
      if (choice === "3") {
        let choicesArray = [];

        // Check if result.data contains comma-separated values
        if (result.data && result.data.includes(",")) {
          choicesArray = result.data.split(",").map((choice) => choice.trim());
        }
        console.log("Choices Array: " + choicesArray);

        setApiChoices(choicesArray);
      }
    } catch (error) {
      console.error("Error sending question:", error);
      setResponse(error.message);
    }
    setIsLoading(false);
  };

  const handleChoiceSelection = (selectedChoice) => {
    // Toggle selection logic
    if (selectedChoices.includes(selectedChoice)) {
      setSelectedChoices(
        selectedChoices.filter((choice) => choice !== selectedChoice)
      );
    } else {
      setSelectedChoices([...selectedChoices, selectedChoice]);
    }
  };

  const renderChoices = () => {
    return (
      <div className="choices-container">
        {apiChoices.map((choice, index) => (
          <Form.Check
            className="choice-item"
            type="checkbox"
            label={choice}
            key={index}
            checked={selectedChoices.includes(choice)}
            onChange={() => handleChoiceSelection(choice)}
          />
        ))}
      </div>
    );
  };
  

  const submitFeedback = async () => {
    const formData = new FormData();
    formData.append("text", `Question: ${inputText} \n Feedback: ${feedback}`);
    formData.append("profile_name", dataset); // Assuming email is the profile_name
    formData.append("mode", "feedback");
    console.log(formData);

    try {
      await axios.post(`http${HTTP_PREFIX}://${API_URL}/uploadtext`, formData, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      displayAlert("Feedback upolload successful", "success");
      // Handle successful submission, e.g., clear feedback or show a message
    } catch (error) {
      console.error("Error sending feedback:", error);
      // Handle error
    }
  };
  
  const fetchFolderFilenames = async (folderName) => {
    if (!isLoading) {
      try {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/get_folder_filenames`,
          { collection_name: folderName },
          { headers: { Authorization: `Bearer ${tokenRef.current}` } }
        );
        setFolderContents({ ...folderContents, [folderName]: response.data });
      } catch (error) {
        console.error("Error fetching folder filenames:", error);
      }
    }
  };

  const submitSelections = async () => {
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question_multistep`,
        {
          choice: "3b",
          broadness: broadness,
          input_text: inputText,
          extra_instructions: backgroundInfo,
          selected_choices: selectedChoices,
          dataset,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );
      setResponse(result.data); // Assuming this is the final answer
      setApiChoices([]); // Clear choices
      setSelectedChoices([]); // Clear selected choices
    } catch (error) {
      console.error("Error submitting selections:", error);
      setResponse(error.message);
    }
    setIsLoading(false);
  };

  return (
    <Container fluid="md" className="mt-4">
      <Row className="justify-content-md-center mt-5">
        <Col md={12}>
          <div className="dataset-folders">
            {availableCollections.map((collection, index) => (
              <Tooltip
                key={index}
                title={
                  Array.isArray(folderContents[collection])
                    ? folderContents[collection].join("\n")
                    : ""
                }
                onOpen={() => fetchFolderFilenames(collection)}
              >
                <div
                  className={`dataset-folder ${
                    activeDragFolder === collection ? "drag-over" : ""
                  }`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setActiveDragFolder(collection);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setActiveDragFolder(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setActiveDragFolder(null);
                    const file = e.dataTransfer.files[0];
                    handleDatasetFileDrop(collection, file); // Use collection for folderName
                  }}
                >
                  <CreateNewFolderIcon />
                  <span>{collection}</span>
                </div>
              </Tooltip>
            ))}
            <div
              className="dataset-folder add-new-folder"
              onClick={handleAddNewFolderClick}
            >
              <span>Add Folder</span>
            </div>
          </div>
        </Col>
      </Row>
      <Row className="justify-content-md-center mt-4">
        <Col md={9}>
          {" "}
          {/* Adjusted width for the question box */}
          <Form.Group className="mb-3">
            <Form.Label>Enter your question or input:</Form.Label>
            <Form.Control
              as="textarea"
              className="chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Form.Text className="text-muted">
              Word Count: {inputText.split(/\s+/).filter(Boolean).length}
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={3}>
          {" "}
          {/* New column for background information */}
          <Form.Group className="mb-3">
            <Form.Label>Additional instructions (optional):</Form.Label>
            <Form.Control
              as="textarea"
              className="background-info-input"
              value={backgroundInfo}
              onChange={(e) => setBackgroundInfo(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="justify-content-md-center">
        <Col md={12}>
          <div className="dropdowns">
            <Form.Group className="mb-3">
              <Form.Label>Select dataset:</Form.Label>
              <Form.Select
                aria-label="Dataset selection"
                className="w-100 mx-auto chat-dropdown"
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
              >
                <option value="" disabled>
                  Select a dataset
                </option>{" "}
                {/* This option is added */}
                {availableCollections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Function:</Form.Label>
              <Form.Select
                aria-label="Function selection"
                className="w-100 mx-auto chat-dropdown"
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                <option value="2">Answer Question</option>
                <option value="1">Continue Answer (Copilot)</option>
                <option value="3">
                  Answer Question with multi-step Topic Selection
                </option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Broadness of database search:</Form.Label>
              <Form.Select
                aria-label="Function selection"
                className="w-100 mx-auto chat-dropdown"
                value={broadness}
                onChange={(e) => setBroadness(e.target.value)}
              >
                <option value="1">Narrow (single database entry)</option>
                <option value="2">Extended (up to 2 entries)</option>
                <option value="3">Broad (up to 3 entries)</option>
              </Form.Select>
            </Form.Group>
          </div>

          <div className="d-flex justify-content-center mb-3">
            <Button
              variant="primary"
              onClick={sendQuestion}
              className="chat-button"
            >
              Submit
            </Button>
          </div>

          {isLoading && (
            <div className="text-center my-3">
              <Spinner animation="border" />
              <div>Elapsed Time: {elapsedTime.toFixed(1)}s</div>
            </div>
          )}
          {choice === "3" && apiChoices.length > 0 && (
            <div>
              {renderChoices()}
              <Button
                variant="primary"
                onClick={submitSelections}
                className="chat-button"
                disabled={selectedChoices.length === 0}
              >
                Generate answers for selected subsections
              </Button>
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Response:</Form.Label>
            <Form.Control
              as="textarea"
              className="chat-output"
              readOnly
              value={response}
              onMouseUp={handleTextHighlight}
            />
            <Form.Text className="text-muted">
              Word Count: {countWords(response)}
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* Feedback Section */}
      <Row className="justify-content-md-center">
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>
              Feedback: (describe how the question can be answered better in the
              future){" "}
            </Form.Label>
            <Form.Control
              as="textarea"
              className="feedback-textarea"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={!questionAsked} // Disabled until a question is asked
            />
          </Form.Group>
          <div className="d-flex justify-content-center mb-3">
            <Button
              variant="primary"
              onClick={submitFeedback}
              className="chat-button"
              disabled={!questionAsked} // Disabled until a question is asked
            >
              Submit Feedback
            </Button>
          </div>
        </Col>
      </Row>
      <Row className="justify-content-md-center">
        <Col md={12}>
          <Button
            variant="primary"
            onClick={appendToEditor}
            className="chat-button"
          >
            Add response to Text Editor
          </Button>

          <Editor
            editorState={editorState}
            onEditorStateChange={onEditorStateChange}
            toolbarClassName="toolbarClassName"
            wrapperClassName="wrapperClassName editor-style"
            editorClassName="editorClassName"
          />
          {/* <Button onClick={downloadDocument}>Download as Word</Button> */}
        </Col>
      </Row>
    </Container>
  );
};

export default withAuth(Chatbot);
