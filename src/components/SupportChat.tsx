import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Widget, addResponseMessage, addUserMessage } from 'react-chat-widget';
import 'react-chat-widget/lib/styles.css';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { API_URL, HTTP_PREFIX } from "../helper/Constants.tsx";
import './SupportChat.css'; // Import custom styles
import sidebarIcon from '../resources/images/mytender.io_badge.png';

import { faComment, faComments } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SupportChat = ({ auth }) => {
  const [messages, setMessages] = useState([]);
  const [isFirstFetch, setIsFirstFetch] = useState(true);
  const messagesRef = useRef(messages);
  const lastUserMessageRef = useRef(null);
  const location = useLocation(); // Get the current location

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

      console.log('Fetched Messages:', fetchedMessages);

      if (Array.isArray(fetchedMessages)) {
        const newMessages = fetchedMessages.filter(
          (fMsg) => !messagesRef.current.some((msg) => msg.id === fMsg.id || msg.text === fMsg.text)
        );

        console.log('New Messages:', newMessages);

        newMessages.forEach((msg) => {
          if (typeof msg.text === 'string') {
            if (msg.text.startsWith('!')) {
              if (isFirstFetch) {
                addUserMessage(msg.text.slice(1)); // Strip the "!" before adding
              }
            } else {
              addResponseMessage(msg.text);
            }
          } else {
            console.error('Invalid message format:', msg);
          }
        });

        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
        setIsFirstFetch(false); // Mark as no longer the first fetch
      } else {
        console.error('Fetched messages is not an array:', fetchedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [auth?.token, isFirstFetch]);

  useEffect(() => {
    if (auth?.token) {
      fetchMessages();
      const intervalId = setInterval(fetchMessages, 10000);
      return () => clearInterval(intervalId);
    }
  }, [auth?.token, fetchMessages]);

  const handleNewUserMessage = async (newMessage) => {
    // Check if the new message is the same as the last user message
    if (lastUserMessageRef.current === newMessage) {
      return; // Don't add the message if it's the same as the last one
    }

    try {
      const formData = new FormData();
      formData.append('message', newMessage);

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
      } else {
        if (typeof message === 'string') {
          addUserMessage(message);
          const newMessageObject = {
            id: new Date().getTime().toString(), // Use current timestamp as unique id
            text: message // Add the message text to the object
          };
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, newMessageObject];
            messagesRef.current = updatedMessages; // Update the ref
            return updatedMessages;
          });
          lastUserMessageRef.current = message; // Update the last user message ref
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Conditionally render the SupportChat based on the current route

  const notRenderedUrls = ['/chatResponse', '/question-crafter']

  if (notRenderedUrls.includes(location.pathname)) {
    return null;
  }

  return (
    <Widget
      handleNewUserMessage={handleNewUserMessage}
      title="Support"
      subtitle="Ask us anything"
      fullScreenMode={false}
      
    />
  );
};

export default SupportChat;
