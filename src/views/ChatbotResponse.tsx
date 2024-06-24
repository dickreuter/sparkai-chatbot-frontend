import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall';
import './ChatbotResponse.css'; // Import the CSS file
import withAuth from '../routes/withAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import handleGAEvent from '../utilities/handleGAEvent';
import { HTTP_PREFIX, API_URL } from '../helper/Constants';
import axios from 'axios';

const ChatbotResponse = () => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");

     const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatResponseMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });

  useEffect(() => {
    // Save messages to localStorage whenever they change
    localStorage.setItem('chatResponseMessages', JSON.stringify(messages));
  }, [messages]);
  
  
    const [inputValue, setInputValue] = useState("");

    const [choice, setChoice] = useState("2");
    const [broadness, setBroadness] = useState("2");
    const [dataset, setDataset] = useState("default");
    const [inputText, setInputText] = useState('');
    const [backgroundInfo, setBackgroundInfo] = useState('');
    const [response, setResponse] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [questionAsked, setQuestionAsked] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [apiChoices, setApiChoices] = useState([]);

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
            { type: 'bot', text: error.response?.status === 400 ? 'Message failed, please contact support...' : error.message }
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
                <div className="input-bar">
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
    );
    
};

export default withAuth(ChatbotResponse);
