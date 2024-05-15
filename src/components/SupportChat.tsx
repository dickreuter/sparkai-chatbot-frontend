import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Widget, addResponseMessage, addUserMessage } from 'react-chat-widget';
import 'react-chat-widget/lib/styles.css';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from "../helper/Constants.tsx";

const SupportChat = ({ auth }) => {
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(messages);

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
          (fMsg) => !messagesRef.current.some((msg) => msg.id === fMsg.id)
        );

        console.log('New Messages:', newMessages);

        newMessages.forEach((msg) => {
          if (typeof msg.text === 'string') {
            if (msg.text.startsWith('!')) {
              addUserMessage(msg.text.slice(1)); // Strip the "!" before adding
            } else {
              addResponseMessage(msg.text);
            }
          } else {
            console.error('Invalid message format:', msg);
          }
        });

        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
      } else {
        console.error('Fetched messages is not an array:', fetchedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [auth?.token]);

  useEffect(() => {
    if (auth?.token) {
      fetchMessages();
      const intervalId = setInterval(fetchMessages, 10000);
      return () => clearInterval(intervalId);
    }
  }, [auth?.token, fetchMessages]);

  const handleNewUserMessage = async (newMessage) => {
    if (newMessage.startsWith('!')) {
      const cleanMessage = newMessage.slice(1);
      if (typeof cleanMessage === 'string') {
        addResponseMessage(cleanMessage);
      }
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
          if (typeof message === 'string') {
            addUserMessage(message);
          }
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
