// src/components/ChatBot.js
import React, { useState, useEffect } from 'react';
import { Widget, addResponseMessage, addUserMessage } from 'react-chat-widget';
import 'react-chat-widget/lib/styles.css';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from "../helper/Constants.tsx";

const SupportChat = ({ auth }) => {
  const [messages, setMessages] = useState([]);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (auth?.token) {
      fetchMessages();
      const intervalId = setInterval(fetchMessages, 10000); // Poll every 10 seconds
      return () => clearInterval(intervalId); // Cleanup interval on unmount
    }
  }, [auth?.token]);

  const fetchMessages = async () => {
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/slack_get_messages`,
        {}, // Keeping it consistent with the example pattern
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        }
      );
      const { messages: fetchedMessages } = response.data;

      if (fetchedMessages.length > messageCount) {

        // Find new messages that are not already in the current state
        const newMessages = fetchedMessages.filter(
          (msg) => !messages.includes(msg)
        );

        // Add only new messages
        newMessages.forEach((msg) => addResponseMessage(msg));

        // Update the state with the new messages and message count
        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
        setMessageCount(fetchedMessages.length);
        console.log(newMessages)
        console.log(messages)
        console.log(messageCount)
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleNewUserMessage = async (newMessage) => {
    if (newMessage.startsWith('!')) {
      const cleanMessage = newMessage.slice(1);
      const newMessages = [cleanMessage];
      newMessages.forEach((msg) => addResponseMessage(msg));
    } else {
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
          addUserMessage(message);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  return (
    <Widget
      handleNewUserMessage={handleNewUserMessage}
      title="Support"
      subtitle="Ask us anything"
    />
  );
};

export default SupportChat;
