import React, { useRef, useState, useEffect } from "react";
import { useAuthUser } from "react-auth-kit";
import withAuth from "../routes/withAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faTrash } from "@fortawesome/free-solid-svg-icons";
import handleGAEvent from "../utilities/handleGAEvent";
import { HTTP_PREFIX, API_URL } from "../helper/Constants";
import axios from "axios";
import "./TenderLibraryChat.css";

const TenderLibraryChat = ({ bid_id }) => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("tenderLibChatMessages");

    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      if (parsedMessages.length > 0) {
        return parsedMessages;
      }
    }

    return [
      {
        type: "bot",
        text: "Ask questions here about your Tender Library documents"
      }
    ];
  });

  useEffect(() => {
    // Save messages to localStorage whenever they change
    localStorage.setItem("tenderLibChatMessages", JSON.stringify(messages));
  }, [messages]);

  const [inputValue, setInputValue] = useState("");

  const [choice, setChoice] = useState("2");
  const [broadness, setBroadness] = useState("4");

  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);

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

  const handleClearMessages = () => {
    setMessages([
      {
        type: "bot",
        text: "Ask questions here about your Tender Library documents"
      }
    ]);
    localStorage.removeItem("tenderLibChatMessages");
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

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: choice,
          broadness: broadness,
          input_text: question,
          extra_instructions: backgroundInfo,
          datasets: [],
          bid_id: bid_id
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
    <div className="tenderchat-container">
      <div className="tenderchat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`tender-message-bubble ${message.type}`}>
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
      <div className="tender-input-bar">
        <input
          type="text"
          placeholder="Please type your question in here..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleClearMessages} className="clear-button">
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
  );
};

export default withAuth(TenderLibraryChat);
