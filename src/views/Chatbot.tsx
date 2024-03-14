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

const Chatbot = () => {
    const [folderContents, setFolderContents] = useState({});

    const [choice, setChoice] = useState("3");
    const [broadness, setBroadness] = useState("1");
    const [dataset, setDataset] = useState("default");

    const [inputText, setInputText] = useState(
        localStorage.getItem('inputText') || ''
      );

    const [response, setResponse] = useState(
        localStorage.getItem('response') || ''
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
    const [appendResponse, setAppendResponse] = useState(false);

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");

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
        const uniqueId = Date.now(); 
        setAppendResponse({ 
            id: uniqueId, // Unique identifier for each append action
            question: inputText, 
            answer: response 
        });
    };
    

    const handleSelect = (selectedKey) => {
        setResponse(selectedKey);
        handleGAEvent('Chatbot', 'Select', 'Template Select Button');
        
    };
    const countWords = (str) => {
        return str.split(/\s+/).filter(Boolean).length;
    };

  
    const [isSaved, setIsSaved] = useState(false);

    
    const saveProposal = async () => {
       
    
        // Retrieve the saved editor state from local storage
        handleGAEvent('Chatbot', 'Save Proposal', 'Save Proposal Button');
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
    
    };
    
    const location = useLocation();
    const bidData = location.state?.bid || ''; 

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
                console.log("instructions");
                askCopilot(selectedText, instructions); // Call sendQuestion function to simulate submit
                console.log(instructions);
            }
             else {
                // User clicked 'Cancel' in the instructions prompt, exit the function
                return;
            }
        }
    };

    

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

    const askCopilot = async (copilotInput: string, instructions: string) => {
        setQuestionAsked(true);
        localStorage.setItem('questionAsked', 'true');
        handleGAEvent('Chatbot', 'Copilot Input', copilotInput);
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
        <div id="chatbot-page">
            <SideBarSmall />
            <SideBar/>
        
            
          <div className="chatbot-container">
    
                <h1 className='heavy'>New Bid</h1>
                
                <div className="library-container mt-4">

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
                                    <Form.Label className="custom-label" >Contract Information</Form.Label>
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
                                        <option value="" disabled>
                                        Company Language Model
                                        </option>
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
                                        <option value="3">Muti-topic Generator</option>
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
                                        <option value="1">Narrow (single database entry)</option>
                                        <option value="2">Extended (up to 2 entries)</option>
                                        <option value="3">Broad (up to 3 entries)</option>
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
                                as="textarea"
                                className="chat-output mt-3 mb-2"
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                onMouseUp={handleTextHighlight}
                            />
                            <Form.Text className="text-muted">
                                Word Count: {countWords(response)}
                            </Form.Text>
                           
                        </Col>
                        <div>
                        <Button className="upload-button mt-2" onClick={handleAppendResponseToEditor}>
                                Add to Proposal
                                {/* down arrow */}
                            </Button>
                        </div>
                        
                                            
                   {/*
                   
                        <Col md={4}>
                        <div className="container">
                        <button >Copilot button</button>
                        <div className="co-pilot-task mt-2">Copilot task...</div>
                        <ul className="options-list">
                            <li>Option 1</li>
                            <li>Option 2</li>
                            <li>Option 3</li>
                            <li>Option 4</li>
                            <li>Option 5</li>
                        </ul>
                        </div>

                        </Col>
                                            */} 
                    </Row>
                </section>
                <section id="proposal">
                
                
                <div className="proposal-header mb-3">
                   
                    <h3 className="custom-label mt-5">Proposal Editor</h3>
                </div>
                <div className="proposal-container">
                        <Row className="justify-content-md-center">
                            <Col md={12}>
                                <div className="d-flex justify-content-center mb-3">
                                <CustomEditor
                                    bidText={bidData.text}
                                    response={response}
                                    appendResponse={appendResponse}
                                    navigatedFromBidsTable={localStorage.getItem('navigatedFromBidsTable') === 'true'}
                                    toolbarClassName="toolbarClassName"
                                    wrapperClassName="wrapperClassName"
                                
                                />
                                </div>
                            </Col>
                            
                        </Row>

                </div>
                </section>
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
                                    className="upload-button mt-1"
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