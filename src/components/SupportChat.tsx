import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { API_URL, HTTP_PREFIX } from "../helper/Constants.tsx";
import './SupportChat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const SupportChat = ({ auth }) => {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const [inputMessage, setInputMessage] = useState('');

  const processMessage = (msg) => {
    console.log("Processing message:", JSON.stringify(msg));
    let text = msg.text;
    let isUserMessage = false;

    console.log("Initial text:", text);

    // Remove the unexpected "!" prefix if present
    if (text.startsWith('!')) {
      console.log("Found '!' prefix, removing...");
      text = text.slice(1).trim();
      console.log("Text after removing '!':", text);
    }

    // Check for "USER" prefix
    if (text.startsWith('USER ')) {
      console.log("Found 'USER' prefix, marking as user message...");
      isUserMessage = true;
      text = text.slice(5).trim();
      console.log("Text after removing 'USER':", text);
    }

    const processedMsg = {
      ...msg,
      isUserMessage,
      text,
    };
    
    return processedMsg;
  };

  const fetchMessages = useCallback(async () => {
    if (!auth?.token) return;
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/slack_get_messages`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        }
      );
      const { messages: fetchedMessages } = response.data;
    
      if (Array.isArray(fetchedMessages)) {
        setMessages(prevMessages => {
          const newMessages = fetchedMessages.filter(
            (fMsg) => !prevMessages.some((msg) => msg.id === fMsg.id)
          );
          
          const updatedMessages = [...prevMessages, ...newMessages.map(msg => {
            const processedMsg = processMessage(msg);
            
            return processedMsg;
          })];
        
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [auth?.token]);

  useEffect(() => {
    if (auth?.token) {
      fetchMessages();
      const intervalId = setInterval(fetchMessages, 5000);
      return () => clearInterval(intervalId);
    }
  }, [auth?.token, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      handleNewUserMessage(inputMessage);
      setInputMessage('');  // Clear input immediately after sending
    }
  };

  const handleNewUserMessage = async (newMessage) => {
    try {
      const formData = new FormData();
      formData.append('message', `USER ${newMessage}`);
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/slack_send_message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      const { message, error } = response.data;
      if (error) {
        console.error("Error sending message:", error);
      } else if (typeof message === 'string') {
        console.log("Raw new user message:", message);
        const newUserMessage = processMessage({ 
          id: new Date().getTime().toString(), 
          text: message,
        });
        console.log("Processed new user message:", JSON.stringify(newUserMessage));
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        fetchMessages();
        
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const notRenderedUrls = ['/chatResponse', '/question-crafter', '/signup', '/reset_password', '/login'];
  if (notRenderedUrls.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="support-chat-container">
      <button onClick={() => setIsOpen(!isOpen)} className="chat-toggle-button">
        <FontAwesomeIcon icon={faComments} />
        <span className="sr-only">{isOpen ? 'Close Chat' : 'Open Chat'}</span>
      </button>
      {isOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <h3>Support Chat</h3>
            <p>Ask us anything</p>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => {
             
              return (
                <div key={msg.id || index} className={`message-container ${msg.isUserMessage ? 'user-message-container' : 'support-message-container'}`}>
                  <div className={`message ${msg.isUserMessage ? 'user-message' : 'support-message'}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input" >
          <div className="bid-input-bar">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button onClick={handleSendMessage}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChat;