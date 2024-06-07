import React, { useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import handleGAEvent from '../utilities/handleGAEvent';
import { Button, Card, Col, Dropdown, Form, Row, Spinner } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./QuestionsCrafter.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import FolderLogic from "../components/Folders.tsx";

const QuestionCrafter = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  
  const [dataset, setDataset] = useState("default");
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const [folderContents, setFolderContents] = useState({});
  const [isAppended, setIsAppended] = useState(false);
  const [appendResponse, setAppendResponse] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("-1"); // Default to "Full Proposal"

  
  const handleDatasetChange = (e) => {
    const newDataset = e.target.value;
    setDataset(newDataset); // Update the state with the new dataset value
    handleGAEvent('Chatbot', 'Dataset Selection', 'Select Dataset Button');
  };

  const handleSelect = (eventKey) => {
    handleDatasetChange({ target: { value: eventKey } });
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


  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const [bidPilotchoice, setBidPilotChoice] = useState("2");
  const [bidPilotbroadness, setBidPilotBroadness] = useState("2");
  const [isBidPilotLoading, setIsBidPilotLoading] = useState(false);

  const [choice, setChoice] = useState("3");
    const [broadness, setBroadness] = useState("2");


  const [backgroundInfo, setBackgroundInfo] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [apiChoices, setApiChoices] = useState([]);
  const [wordAmounts, setWordAmounts] = useState({});



  const [inputText, setInputText] = useState(
    localStorage.getItem('inputText') || ''
  );

  const [response, setResponse] = useState(
    localStorage.getItem('response') || ''
  );

  const [messageResponse, setMessageResponse] = useState(
    localStorage.getItem('response') || ''
  );


  useEffect(() => {
    localStorage.setItem('inputText', inputText);
    localStorage.setItem('response', response);
  }, [inputText, response]);

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



  const handleSendMessage = () => {
    if (inputValue.trim() !== "") {
      setMessages([...messages, { type: 'user', text: inputValue }]);
      sendQuestion(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const sendQuestion = async (question) => {
    handleGAEvent('Chatbot', 'Submit Question', 'Submit Button');
    setQuestionAsked(true);
    setMessageResponse("");
    setIsBidPilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    // Add a temporary bot message with loading dots
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'bot', text: 'loading' }
    ]);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: bidPilotchoice,
          broadness: bidPilotbroadness,
          input_text: question,
          extra_instructions: backgroundInfo,
          dataset,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );

      // Replace the temporary loading message with the actual response
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: 'bot', text: result.data }
      ]);
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: 'bot', text: error.response?.status === 400 ? 'Message failed, please contact support...' : error.message }
      ]);
    }
    setIsBidPilotLoading(false);
  };


  const sendQuestionToChatbot = async () => {
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


  return (
    <div className="chatpage">
      <SideBarSmall />

      <div className="lib-container">
        <BidNavbar />
        <div className="proposal-header mb-2">
          <h1 className='heavy'>Question Crafter</h1>
          <div className="dropdown-container">
            <Button className={`upload-button`}>
              Next Question
            </Button>
          </div>
        </div>
        <div>

        <Row className="justify-content-md-center mt-4" style={{ visibility: 'hidden', height: 0, overflow: 'hidden' }}>
                        <FolderLogic
                            tokenRef={tokenRef}
                            setAvailableCollections={setAvailableCollections}
                            setFolderContents={setFolderContents}
                            availableCollections={availableCollections}
                            folderContents={folderContents}
                        />
        </Row>


          <Row>
            <Col md={8}>

              <div className="proposal-header mb-2">
                <h1 className="lib-title">Question</h1>
                <div className="dropdown-container">

                  <Dropdown onSelect={handleSelect} className="w-100 mx-auto chat-dropdown">
                    <Dropdown.Toggle className="upload-button" style={{ backgroundColor: 'black' }} id="dropdown-basic">
                      {dataset || "Select a dataset"}
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="w-100">
                      {availableCollections.map((collection) => (
                        <Dropdown.Item key={collection} eventKey={collection}>
                          {collection}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

              <div className="question-answer-box">
                <textarea
                  className="card-textarea"
                  placeholder="Enter question here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                ></textarea>
              </div>
              <div className="text-muted mt-2">
                  Word Count: {inputText.split(/\s+/).filter(Boolean).length}
              </div>
              <Button  className="upload-button mt-2" onClick={sendQuestionToChatbot}>
                Submit
              </Button>

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

              <h1 className="lib-title mt-4 mb-3">Response</h1>

              <div className="response-box">
                <textarea
                  className="card-textarea"
                  placeholder="Enter response here..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                ></textarea>
              </div>

              <Button
                        variant={isAppended ? "success" : "primary"}
                        className="upload-button mt-2 mb-4" 
                        onClick={handleAppendResponseToEditor}
                        disabled={isLoading || isAppended} 
              >   
                    {isAppended ? "Added" : "Add to Proposal"}
              </Button>

            </Col>
            <Col md={4}>
              <div className="input-header">
                <div className="proposal-header mb-2">
                  <h1 className="lib-title" style={{ color: "white" }}>Bid Pilot</h1>
                  <div className="dropdown-container">
                    <Button className={`arrow-button`}>
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </Button>
                    <Button className={`arrow-button`}>
                      <FontAwesomeIcon icon={faChevronRight} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bid-pilot-container">
                <div className="chatResponse-container">
                  <div className="mini-messages">
                    {messages.map((message, index) => (
                      <div key={index} className={`message-bubble-small ${message.type}`}>
                        {message.text === 'loading' ? (
                          <div className="loading-dots">
                            <span>. </span>
                            <span>. </span>
                            <span>. </span>
                          </div>
                        ) : (
                          message.text
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="input-console">
                    <div className="proposal-header mb-2">
                      <div className="checkbox-container">
                        <label className="checkbox-label">
                          <input type="checkbox" name="company-library" className="checkbox" />
                          Company Library
                        </label>
                        <label className="checkbox-label">
                          <input type="checkbox" name="internet-search" className="checkbox" />
                          Internet Search
                        </label>
                      </div>
                      <div className="dropdown-container mb-2">
                        <Button className={`option-button`}>
                          Prompts
                        </Button>
                        <Button className={`option-button `}>
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="bid-input-bar">
                      <input
                        type="text"
                        placeholder="Please type your question in here..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <button onClick={handleSendMessage}>
                        <FontAwesomeIcon icon={faPaperPlane} />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}


export default withAuth(QuestionCrafter);
