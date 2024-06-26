import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {useAuthUser} from "react-auth-kit";
import {Button, Col, Container, Form, Row, Spinner, Card} from "react-bootstrap";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import {displayAlert} from "../helper/Alert";
import {API_URL, HTTP_PREFIX} from "../helper/Constants";
import withAuth from "../routes/withAuth";
import "./Chatbot.css";
import FolderLogic from "../components/Folders";
import CustomEditor from "../components/TextEditor.tsx";
import TemplateLoader from "../components/TemplateLoader.tsx";
import SideBar from '../routes/Sidebar.tsx'
import { useLocation } from 'react-router-dom';
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import SideBarSmall from '../routes/SidebarSmall.tsx' ;
import handleGAEvent from "../utilities/handleGAEvent.tsx";
import ProposalEditor from "./ProposalEditor.tsx";
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { stateToHTML } from 'draft-js-export-html';

const Chatbot = () => {
    const [folderContents, setFolderContents] = useState({});

    const [choice, setChoice] = useState("3");
    const [broadness, setBroadness] = useState("2");
    const [dataset, setDataset] = useState("default");

    const [inputText, setInputText] = useState(
        localStorage.getItem('inputText') || ''
      );

    

    const [isLoading, setIsLoading] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const [backgroundInfo, setBackgroundInfo] = useState(
        localStorage.getItem('backgroundInfo') || ''
      );
    const [bidInfo, setBidInfo] = useState(
        localStorage.getItem('bidInfo') || ''
      );

    const [availableCollections, setAvailableCollections] = useState<string[]>(
        []
    );

    const [feedback, setFeedback] = useState("");
    const [questionAsked, setQuestionAsked] = useState(false);
    const [apiChoices, setApiChoices] = useState([]);
    const [selectedChoices, setSelectedChoices] = useState([]);
    const [wordAmounts, setWordAmounts] = useState({});



    const [appendResponse, setAppendResponse] = useState(false);
    const [response, setResponse] = useState(
        localStorage.getItem('response') || ''
      );
    
    const [isCopilotVisible, setIsCopilotVisible] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const textAreaRef = useRef(null);  // Reference to the textarea

    

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");

    const [selectedQuestionId, setSelectedQuestionId] = useState("-1"); // Default to "Full Proposal"
    const location = useLocation();
    const bidData = location.state?.bid || ' ';
    //console.log(bidData);

    const handleDatasetChange = (e) => {
        const newDataset = e.target.value;
        setDataset(newDataset); // Update the state with the new dataset value


        handleGAEvent('Chatbot', 'Dataset Selection', 'Select Dataset Button');
      };

    const handleFunctionChange = (e) => {
        const newChoice = e.target.value;
        setChoice(newChoice); // Update the state with the new choice


        handleGAEvent('Chatbot', 'Function Selection', 'Select Function Button');
    };

      // Broadness dropdown onChange handler
    const handleBroadnessChange = (e) => {
        const newBroadness = e.target.value;
        setBroadness(newBroadness); // Update the state with the new broadness level


        handleGAEvent('Chatbot', 'Broadness Selection', 'Select Broadness Button');
    };


    const handleAppendResponseToEditor = () => {
        handleGAEvent('Chatbot', 'Append Response', 'Add to Proposal Button');
        setSelectedQuestionId("-1"); // Reset dropdown to "Full Proposal"
    
        // Delay the next operation to ensure UI updates smoothly
        setTimeout(() => {
            const uniqueId = Date.now();
            setAppendResponse({
                id: uniqueId, // Unique identifier for each append action
                question: inputText,
                answer: response
            });
    
            setIsAppended(true);
            setTimeout(() => setIsAppended(false), 3000);
        }, 100); // Adjust the delay here based on your needs
    };
    


    const handleSelect = (selectedKey) => {
        setResponse(selectedKey);
        handleGAEvent('Chatbot', 'Select', 'Template Select Button');

    };
    const countWords = (str) => {
        return str.split(/\s+/).filter(Boolean).length;
    };


    const [isSaved, setIsSaved] = useState(false);
    const [isAppended, setIsAppended] = useState(false);

    const saveProposal = async () => {


        // Retrieve the saved editor state from local storage
       
        const savedData = localStorage.getItem('editorState');
        let editorText = '';
        if (savedData) {
            const contentState = convertFromRaw(JSON.parse(savedData));
            editorText = contentState.getBlocksAsArray().map(block => block.getText()).join('\n');
        }

        const formData = new FormData();
        formData.append('bid_title', bidInfo);
        formData.append('text', editorText);
        formData.append('status', 'ongoing');
        formData.append('contract_information', backgroundInfo);



        try {
            const result = await axios.post(
                `http${HTTP_PREFIX}://${API_URL}/upload_bids`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${tokenRef.current}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );


            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000); // Reset after 3 seconds
        } catch (error) {
            console.error("Error saving proposal:", error);
            setResponse(error.message);
        }
        handleGAEvent('Chatbot', 'Save Proposal', 'Save Proposal Button');

    };

    
    const retrieveEditorState = () => {
        const savedData = localStorage.getItem('editorState');
        if (savedData) {
            const rawContent = JSON.parse(savedData);
            const contentState = convertFromRaw(rawContent);
            return EditorState.createWithContent(contentState);
        }
        return EditorState.createEmpty();
    };

    const exportToDocx = (editorState) => {
        if (!editorState) {
            console.error("No editor state available");
            return;
        }
    
        // Convert editor state to plain text or implement your HTML to DOCX logic here
        const contentState = editorState.getCurrentContent();
        const contentText = contentState.getPlainText('\n');
    
        // Create a new document
        const doc = new Document({
            sections: [{
                properties: {},
                children: contentText.split('\n').map(line => new Paragraph({
                    children: [new TextRun(line)]
                }))
            }]
        });
    
        // Used Packer to create a Blob
        Packer.toBlob(doc).then(blob => {
            // Save the Blob as a DOCX file
            saveAs(blob, 'proposal.docx');
        }).catch(err => {
            console.error('Error creating DOCX:', err);
        });
    };
    

  
    //console.log(bidData);

    useEffect(() => {


        const navigatedFromBidsTable = localStorage.getItem('navigatedFromBidsTable');
        //console.log(navigatedFromBidsTable)

        if (navigatedFromBidsTable === 'true' && location.state?.fromBidsTable && bidData) {
            //console.log("Navigated from bids table with bid data:", bidData);

            // Indicate that data has been loaded from navigation

            // Update form states with data from navigation or provide default values
            setBidInfo(bidData?.bid_title || '');
            setBackgroundInfo(bidData?.contract_information || '');
            setInputText('');
            setResponse('');

            // Update local storage to match the navigation data
            localStorage.setItem('bidInfo', bidData?.bid_title || '');
            localStorage.setItem('backgroundInfo', bidData?.contract_information || '');
            localStorage.setItem('inputText', '');
            localStorage.setItem('response', '');

            localStorage.setItem('navigatedFromBidsTable', 'false');

            localStorage.getItem('bidInfo') || '';
            localStorage.getItem('backgroundInfo') || '';
            localStorage.getItem('inputText') || '';
            localStorage.getItem('response') || '';

            // Handle editor state from bidData, if available
            try {
                if (bidData?.text) {
                    const contentState = ContentState.createFromText(bidData.text);
                    const newEditorState = EditorState.createWithContent(contentState);
                    localStorage.setItem('editorState', JSON.stringify(convertToRaw(newEditorState.getCurrentContent())));

                }
            } catch (error) {
                console.error("Error processing editor state:", error);
            }
        } else {
            //console.log("Loading data from local storage or post-edit");
            // Function to load data from local storage


        }
    }, [location, bidData]);



    // Update local storage and handle session flag on form changes
    useEffect(() => {
        localStorage.setItem('bidInfo', bidInfo);
        localStorage.setItem('backgroundInfo', backgroundInfo);
        localStorage.setItem('inputText', inputText);
        localStorage.setItem('response', response);
      }, [bidInfo, backgroundInfo, inputText, response]);





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


    useEffect(() => {
        const questionStatus = localStorage.getItem('questionAsked') === 'true';
        setQuestionAsked(questionStatus);
    }, []);

    

    useEffect(() => {
        // Check if there is a hash in the URL
        if (location.hash) {
          const id = location.hash.replace('#', '');
          const element = document.getElementById(id);
          if (element) {
            // Scroll to the element with options
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });


          }
        }
      }, [location]); // Re-run the effect if the location changes


    const submitFeedback = async () => {
        handleGAEvent('Chatbot', 'Submit Feedback', 'Submit Feedback Button');
        const formData = new FormData();
        formData.append("text", `Question: ${inputText} \n Feedback: ${feedback}`);
        formData.append("profile_name", dataset); // Assuming email is the profile_name
        formData.append("mode", "feedback");
        //console.log(formData);

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

  

    const sendQuestion = async () => {
        //console.log("question asked");
        handleGAEvent('Chatbot', 'Submit Question', 'Submit Button');
        setQuestionAsked(true);
        localStorage.setItem('questionAsked', 'true');
        setResponse("");
        setIsLoading(true);
        setStartTime(Date.now()); // Set start time for the timer
        console.log(dataset)
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
                //console.log("API Response:", result);

                //console.log("Choices Array: " + choicesArray);

                setApiChoices(choicesArray);
            }
        } catch (error) {
            console.error("Error sending question:", error);
            setResponse(error.message);
        }
        setIsLoading(false);
    };

const handleChoiceSelection = (selectedChoice) => {
    if (selectedChoices.includes(selectedChoice)) {
        setSelectedChoices(
            selectedChoices.filter((choice) => choice !== selectedChoice)
        );
        setWordAmounts((prevWordAmounts) => {
            const newWordAmounts = { ...prevWordAmounts };
            delete newWordAmounts[selectedChoice];
            return newWordAmounts;
        });
    } else {
        setSelectedChoices([...selectedChoices, selectedChoice]);
        setWordAmounts((prevWordAmounts) => ({
            ...prevWordAmounts,
            [selectedChoice]: 500 // Default word amount
        }));
    }
};


const renderChoices = () => {
    return (
        <div className="choices-container">
            {apiChoices.map((choice, index) => (
                <div key={index} className="choice-item d-flex align-items-center">
                    <Form.Check
                        type="checkbox"
                        label={choice}
                        checked={selectedChoices.includes(choice)}
                        onChange={() => handleChoiceSelection(choice)}
                    />
                    {selectedChoices.includes(choice) && (
                        <Form.Control
                            type="number"
                            value={wordAmounts[choice] || 500}
                            onChange={(e) => setWordAmounts({
                                ...wordAmounts,
                                [choice]: parseInt(e.target.value, 10)
                            })}
                            min={1}
                            className="ml-2"
                            placeholder="500"
                            style={{ width: '120px', marginLeft: '10px' }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};





const submitSelections = async () => {
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    try {
        const word_amounts = selectedChoices.map((choice) => wordAmounts[choice] || 100);
        const result = await axios.post(
            `http${HTTP_PREFIX}://${API_URL}/question_multistep`,
            {
                choice: "3b",
                broadness: broadness,
                input_text: inputText,
                extra_instructions: backgroundInfo,
                selected_choices: selectedChoices,
                dataset,
                word_amounts
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
        setWordAmounts({}); // Clear word amounts
    } catch (error) {
        console.error("Error submitting selections:", error);
        setResponse(error.message);
    }
    setIsLoading(false);
};


    const askCopilot = async (copilotInput: string, instructions: string, copilot_mode: string) => {
        setQuestionAsked(true);
        localStorage.setItem('questionAsked', 'true');
        handleGAEvent('Chatbot', 'Copilot Input', copilotInput);
        setIsLoading(true);
        setStartTime(Date.now()); // Set start time for the timer

        console.log({
            input_text: copilotInput,
            extra_instructions: instructions,
            copilot_mode: copilot_mode,
            dataset,
          });
          

        try {
            const result = await axios.post(
                `http${HTTP_PREFIX}://${API_URL}/copilot`,
                {
                    input_text: copilotInput,
                    extra_instructions: instructions,
                    copilot_mode: copilot_mode,
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

    useEffect(() => {
        const checkTextSelection = () => {
            if (textAreaRef.current && document.activeElement === textAreaRef.current) {
                const textArea = textAreaRef.current;
                const selectedText = textArea.value.substring(textArea.selectionStart, textArea.selectionEnd);
                setIsCopilotVisible(!!selectedText);
                setSelectedText(selectedText);
                console.log(selectedText);
                
                if (!selectedText) {
                    // Delay clearing the selection state to allow for link clicks to be processed
                    setTimeout(() => {
                        setIsCopilotVisible(false);
                    }, 100); // 100 ms delay
                }
            } else {
                setTimeout(() => {
                    setIsCopilotVisible(false);
                    setSelectedText('');
                }, 100); // 100 ms delay
            }
        };

        // Listen for mouse up and key up events to capture text selections
        document.addEventListener('mouseup', checkTextSelection);
        document.addEventListener('keyup', checkTextSelection);

        return () => {
            document.removeEventListener('mouseup', checkTextSelection);
            document.removeEventListener('keyup', checkTextSelection);
        };
    }, []);
    return (
        <div className="chatpage">
            <SideBarSmall />
                            {/* <SideBar
                    isCopilotVisible={isCopilotVisible}
                    setIsCopilotVisible={setIsCopilotVisible}
                    selectedText={selectedText} // Pass the selected text to the Sidebar component
                    askCopilot={askCopilot}
                /> */}

          <div className="lib-container">

                <h1 className='heavy'>New Bid</h1>

                <div className="mt-4">

                <section id="bidinfo">


                    <Row >
                        <Col md={6}>
                                    {/* Need to add Bid Name field*/}
                                <Form.Group className="mb-3">
                                    <Form.Label className="custom-label">Bid Name</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        className="bid-name-input"
                                        value={bidInfo}
                                        onChange={(e) => setBidInfo(e.target.value)}

                                    />
                                </Form.Group>

                                {" "}
                                {/* New column for background information
                                used to be Additional instructions (optional)*/}
                                <Form.Group className="mb-3">
                                    <Form.Label className="custom-label" >Win Themes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        className="background-info-input"
                                        value={backgroundInfo}
                                        onChange={(e) => setBackgroundInfo(e.target.value)}
                                    />
                                </Form.Group>
                        </Col>
                        <Col md={6}>
                            <div className="dropdowns">
                                    <Form.Group className="mb-3">
                                    <Form.Label className="custom-label">Company Language Model:</Form.Label>
                                    <Form.Select
                                        aria-label="Dataset selection"
                                        className="w-100 mx-auto chat-dropdown"
                                        value={dataset}
                                        onChange={handleDatasetChange} // Updated to use the new handler
                                    >
                                      
                                        {/* This option is added */}
                                        {availableCollections.map((collection) => (
                                        <option key={collection} value={collection}>
                                            {collection}
                                        </option>
                                        ))}
                                    </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                    <Form.Label className="custom-label">Function:</Form.Label>
                                    <Form.Select
                                        aria-label="Function selection"
                                        className="w-100 mx-auto chat-dropdown"
                                        value={choice}
                                        onChange={handleFunctionChange}
                                    >
                                        <option value="3">Multi-topic Generator</option>
                                        <option value="2">Auto Response</option>
                                    </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                    <Form.Label className="custom-label">Broadness of database search:</Form.Label>
                                    <Form.Select
                                        aria-label="Broadness selection"
                                        className="w-100 mx-auto chat-dropdown"
                                        value={broadness}
                                        onChange={handleBroadnessChange}
                                    >
                                        <option value="1">Narrow (3 entries)</option>
                                        <option value="2">Extended (up to 6 entries)</option>
                                        <option value="3">Broad (up to 9 entries)</option>
                                    </Form.Select>
                                    </Form.Group>
                                </div>
                        </Col>

                    </Row>
                </section>

                    <section id="inputquestion">
                    <Row
                        className="justify-content-md-center mt-4"
                        style={{ visibility: 'hidden', height: 0, overflow: 'hidden' }}
                    >
                        <FolderLogic
                            tokenRef={tokenRef}
                            setAvailableCollections={setAvailableCollections}
                            setFolderContents={setFolderContents}
                            availableCollections={availableCollections}
                            folderContents={folderContents}
                        />
                    </Row>


                    <Row className="justify-content-md-center">
                        <Col md={12}>
                            {" "}
                            {/* Adjusted width for the question box */}
                            <Form.Group >
                                <Form.Label className="custom-label">Enter your question or input:</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    className="chat-input mb-2"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <Form.Text className="text-muted">
                                    Word Count: {inputText.split(/\s+/).filter(Boolean).length}
                                </Form.Text>
                            </Form.Group>
                            <Button
                                onClick={sendQuestion}
                                className="upload-button mt-2"
                            >
                                Submit
                            </Button>



                        </Col>




                    </Row>
                    <Row>
                    <div className="mb-3" style={{textAlign: "left"}}>


                        {isLoading && (
                            <div className="my-3">
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
                                    className="upload-button mt-3"
                                    disabled={selectedChoices.length === 0}
                                >
                                    Generate answers for selected subsections
                                </Button>
                            </div>
                        )}
                        </div>
                    </Row>

                </section>
                <section id="response">
                    <Row className="justify-content-md-center mt-3">
                        <Col md={12}>

                            <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
                                <Form.Label className="custom-label mb-0">Response:</Form.Label>
                                <TemplateLoader token={tokenRef.current} handleSelect={handleSelect}/>
                            </Form.Group>
                            <Form.Control
                                ref={textAreaRef}
                                as="textarea"
                                className="chat-output mt-3 mb-2"
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                               
                            />
                            <Form.Text className="text-muted">
                                Word Count: {countWords(response)}
                            </Form.Text>

                        </Col>
                        <div>
                        <Button
                        variant={isAppended ? "success" : "primary"}
                        className="upload-button mt-2 mb-4" 
                        onClick={handleAppendResponseToEditor}
                        disabled={isLoading || isAppended} 
                        >   
                                {isAppended ? "Added" : "Add to Proposal"}
                            </Button>
                        </div>


        
                    </Row>




                </section>
                
                {bidData ? (
                    <ProposalEditor
                        bidData={bidData}
                        appendResponse={appendResponse}
                        selectedQuestionId={selectedQuestionId}
                        setSelectedQuestionId={setSelectedQuestionId}
                    />
                ) : (
                    <div>Loading or no bid data available...</div>
                )}


                <Row className="mt-3">
                            <div >
                            <Button
                                variant={isSaved ? "success" : "primary"}
                                onClick={saveProposal}
                                className={`mt-1 upload-button ${isSaved && 'saved-button'}`}
                                disabled={isLoading || isSaved} // Consider disabling the button while saving or after saved
                            >
                                {isSaved ? "Saved" : "Save Proposal"}
                            </Button>
                            <Button
                                variant={"primary"}
                                onClick={() => exportToDocx(retrieveEditorState())} // Use an arrow function to delay execution
                                className="mt-1 ml-2 upload-button"
                                disabled={isLoading}
                                style={{marginLeft: "5px", backgroundColor: "black"}}
                            >
                                Export to Word
                            </Button>


                            </div>
                </Row>


                    <Row className="mt-5">
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
                            <div className="d-flex">
                                <Button
                                    variant="primary"
                                    onClick={submitFeedback}
                                    className="upload-button mt-1 mb-2"
                                    disabled={!questionAsked} // Disabled until a question is asked
                                >
                                    Submit Feedback
                                </Button>
                            </div>
                            <div className="d-flex">

                            </div>

                        </Col>

                    </Row>




            </div>
            </div>
        </div>
    );
};

export default withAuth(Chatbot);
