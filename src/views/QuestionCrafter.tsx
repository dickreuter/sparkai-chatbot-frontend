import React, { useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import handleGAEvent from '../utilities/handleGAEvent';
import { Button, Card, Col, Dropdown, Row } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./QuestionsCrafter.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const QuestionCrafter = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);

  const [dataset, setDataset] = useState("default");
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const handleDatasetChange = (e) => {
    const newDataset = e.target.value;
    setDataset(newDataset); // Update the state with the new dataset value
    handleGAEvent('Chatbot', 'Dataset Selection', 'Select Dataset Button');
  };
  const handleSelect = (eventKey) => {
    handleDatasetChange({ target: { value: eventKey } });
  };

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const [choice, setChoice] = useState("2");
  const [broadness, setBroadness] = useState("2");
  const [inputText, setInputText] = useState('');
  const [backgroundInfo, setBackgroundInfo] = useState('');
  const [response, setResponse] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [apiChoices, setApiChoices] = useState([]);

  useEffect(() => {
    if (isLoading) {
      console.log("Loading...");
    } else {
      console.log("Finished loading");
    }
  }, [isLoading]);

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
    setResponse("");
    setIsLoading(true);
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
          choice: choice,
          broadness: broadness,
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
        { type: 'bot', text: error.message }
      ]);
    }
    setIsLoading(false);
  };

  return (
    <div className="chatpage">
      <SideBarSmall />

      <div className="lib-container">
        <BidNavbar />
        <div className="proposal-header">
          <h1 className='heavy'>Question Crafter</h1>
          <div className="dropdown-container">
            <Button className={`upload-button`}>
              Next Question
            </Button>
          </div>
        </div>
        <div>

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
                <textarea className="card-textarea" placeholder="Enter bid proposition here..."></textarea>
              </div>

              <h1 className="lib-title mt-4 mb-3">Response</h1>

              <div className="question-answer-box">
                <textarea className="card-textarea" placeholder="Enter bid proposition here..."></textarea>
              </div>

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
