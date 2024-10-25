import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall";
import "./ChatbotResponse.css"; // Import the CSS file
import withAuth from "../routes/withAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faTrash } from "@fortawesome/free-solid-svg-icons";
import handleGAEvent from "../utilities/handleGAEvent";
import { HTTP_PREFIX, API_URL } from "../helper/Constants";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import QuickQuestionWizard from "../wizards/QuickQuestionWizard";

const ChatbotResponse = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatResponseMessages");
    console.log("Saved messages:", savedMessages);

    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      if (parsedMessages.length > 0) {
        return parsedMessages;
      }
    }

    return [
      {
        type: "bot",
        text: "Welcome to Quick Question! You can ask questions here about your Content Library data."
      }
    ];
  });

  useEffect(() => {
    // Save messages to localStorage whenever they change
    localStorage.setItem("chatResponseMessages", JSON.stringify(messages));
  }, [messages]);

  const [inputValue, setInputValue] = useState("");

  const [choice, setChoice] = useState("2");
  const [broadness, setBroadness] = useState("2");
  const [dataset, setDataset] = useState("default");

  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleSendMessage = () => {
    if (inputValue.trim() !== "") {
      setMessages([...messages, { type: "user", text: inputValue }]);
      sendQuestion(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleClearMessages = () => {
    setMessages([
      {
        type: "bot",
        text: "Welcome to Quick Question! You can ask questions here about your Content Library data."
      }
    ]);
    localStorage.removeItem("chatResponseMessages");
    handleCloseModal();
  };

  const formatResponse = (response) => {
    // Handle numbered lists
    response = response.replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>");
    if (response.includes("<li>")) {
      response = `<ol>${response}</ol>`;
    }

    // Handle bullet points
    response = response.replace(/^[-•]\s(.+)$/gm, "<li>$1</li>");
    if (response.includes("<li>") && !response.includes("<ol>")) {
      response = `<ul>${response}</ul>`;
    }

    // Handle bold text
    response = response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle italic text
    response = response.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Handle newlines for better readability
    response = response.replace(/\n/g, "<br>");

    return response;
  };
  const sendQuestion = async (question) => {
    handleGAEvent("Chatbot", "Submit Question", "Submit Button");
    setQuestionAsked(true);
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    // Add a temporary bot message with loading dots
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "bot", text: "loading" }
    ]);

    const backgroundInfo = messages
      .map((msg) => `${msg.type}: ${msg.text}`)
      .join("\n");
    console.log(backgroundInfo);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: choice,
          broadness: broadness,
          input_text: question,
          extra_instructions: backgroundInfo,
          datasets: ["default"]
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );

      // Replace the temporary loading message with the actual response
      const formattedResponse = formatResponse(result.data);

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: "bot", text: formattedResponse }
      ]);
    } catch (error) {
      console.error("Error sending question:", error);

      // Replace the temporary loading message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          type: "bot",
          text:
            error.response?.status === 400
              ? "Message failed, please contact support..."
              : error.message
        }
      ]);
    }
    setIsLoading(false);
  };

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="chatResponse-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message-bubble ${message.type}`}>
              {message.text === "loading" ? (
                <div className="loading-dots">
                  <span>. </span>
                  <span>. </span>
                  <span>. </span>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: message.text }} />
              )}
            </div>
          ))}
        </div>
        <div className="input-bar">
          <input
            type="text"
            placeholder="Please type your question in here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleShowModal} className="clear-button" id="clear">
            <FontAwesomeIcon icon={faTrash} />
          </button>
          {/* <Button className="chat-Response-Clear-Button" onClick={handleClearMessages}>Clear</Button> */}
          <button
            onClick={!isLoading ? handleSendMessage : null}
            disabled={isLoading}
            className="bar-button"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Clear Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to clear the entire conversation?
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="upload-button"
            style={{ backgroundColor: "red" }}
            onClick={handleClearMessages}
          >
            Clear
          </Button>
        </Modal.Footer>
      </Modal>
      <QuickQuestionWizard />
    </div>
  );
};

export default withAuth(ChatbotResponse);
