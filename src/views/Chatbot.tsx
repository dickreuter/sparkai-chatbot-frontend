import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {useAuthUser} from "react-auth-kit";
import {Button, Col, Container, Form, Row, Spinner} from "react-bootstrap";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import {displayAlert} from "../helper/Alert";
import {API_URL, HTTP_PREFIX} from "../helper/Constants";
import withAuth from "../routes/withAuth";
import "./Chatbot.css";
import FolderLogic from "../components/Folders";
import CustomEditor from "../components/TextEditor.tsx";
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';

const Chatbot = () => {
    const [folderContents, setFolderContents] = useState({});

    const [choice, setChoice] = useState("3");
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

    const [feedback, setFeedback] = useState("");
    const [questionAsked, setQuestionAsked] = useState(false);
    const [apiChoices, setApiChoices] = useState([]);
    const [selectedChoices, setSelectedChoices] = useState([]);
    // Define a new state to trigger the append action
    const [appendResponse, setAppendResponse] = useState(false);

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    const handleAppendResponseToEditor = () => {
        setAppendResponse({question: inputText, answer: response}); // Include both question and answer
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

    const handleTextHighlight = async () => {
        const selectedText = window.getSelection().toString();
        if (selectedText) {
            // Add a confirmation popup

            // User clicked 'OK', ask for further instructions
            const instructions = window.prompt(
                "Please enter instructions how to enhance the selected text:"
            );
            if (instructions) {
                await new Promise((resolve) => setTimeout(resolve, 0));
                askCopilot(selectedText, instructions); // Call sendQuestion function to simulate submit
            } else {
                // User clicked 'Cancel' in the instructions prompt, exit the function
                return;
            }
        }
    };

    const askCopilot = async (copilotInput: string, instructions: string) => {
        setQuestionAsked(true);
        setIsLoading(true);
        setStartTime(Date.now()); // Set start time for the timer

        try {
            const result = await axios.post(
                `http${HTTP_PREFIX}://${API_URL}/copilot`,
                {
                    input_text: copilotInput,
                    extra_instructions: instructions,
                    dataset,
                },
                {
                    headers: {
                        Authorization: `Bearer ${tokenRef.current}`,
                    },
                }
            );

            // Assuming the original 'response' state contains the text you're working with
            // and 'copilotInput' is the text selected by the user that was sent for processing
            // Replace the 'copilotInput' in the 'response' with 'result.data'
            if (response.includes(copilotInput)) {
                const updatedResponse = response.replace(copilotInput, result.data);
                setResponse(updatedResponse);
            } else {
                console.error("Selected text not found in the response.");
                // Optionally handle the case where the selected text isn't found
                // For example, you might want to append the result or alert the user
            }
        } catch (error) {
            console.error("Error sending question:", error);
            setResponse(error.message); // Consider how you want to handle errors, e.g., appending them or alerting the user
        }
        setIsLoading(false);
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
                headers: {Authorization: `Bearer ${tokenRef.current}`},
            });
            displayAlert("Feedback upload successful", "success");
            // Handle successful submission, e.g., clear feedback or show a message
        } catch (error) {
            console.error("Error sending feedback:", error);
            // Handle error
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
            <Row className="justify-content-md-center mt-4">
                <Col md={12}>
                    <FolderLogic
                        tokenRef={tokenRef}
                        setAvailableCollections={setAvailableCollections}
                        setFolderContents={setFolderContents}
                        availableCollections={availableCollections}
                        folderContents={folderContents}
                    />
                </Col>
            </Row>
            <Row className="justify-content-md-center">
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
                                </option>
                                {" "}
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
                                <option value="3">
                                    Answer Question with multi-step Topic Selection
                                </option>
                                <option value="2">One Step Question answering</option>
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
                        <VerticalAlignBottomIcon/>
                        <Button
                            variant="primary"
                            onClick={sendQuestion}
                            className="chat-button"
                        >
                            Submit
                        </Button>
                        <VerticalAlignBottomIcon/>

                    </div>

                    {isLoading && (
                        <div className="text-center my-3">
                            <Spinner animation="border"/>
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
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
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
                        onClick={handleAppendResponseToEditor}
                        className="mt-3"
                    >
                        Add question/answer to Text Editor
                        {/*down arrow */}

                    </Button>
                    <div>
                        <VerticalAlignBottomIcon/>
                    </div>
                    <CustomEditor response={response} appendResponse={appendResponse}/>

                </Col>
            </Row>
        </Container>
    );
};

export default withAuth(Chatbot);
