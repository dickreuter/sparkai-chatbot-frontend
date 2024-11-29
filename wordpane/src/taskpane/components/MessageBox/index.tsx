import React, { useEffect, useRef, useState } from "react";
import { IButtonStatus, IMessage, IShortcutType } from "../../../types";
import { Button, Grid, Typography } from "@mui/material";
import {
  NorthWest as NorthWestIcon,
  PublishedWithChanges as PublishedWithChangesIcon,
  Replay as ReplayIcon,
} from "@mui/icons-material";
import Creator from "./Creator";

import "./MessageBox.css";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "@uiw/react-markdown-preview/markdown.css";

interface MessageBoxProps {
  messages: IMessage[];
  showShortcuts: boolean;
  handleClickShortcut?: (type: IShortcutType, message: IMessage) => void;
  shortcutVisible?: (message: IMessage, type: IShortcutType) => IButtonStatus;
}

const shortcuts: {
  type: IShortcutType;
  title: string;
  icon: JSX.Element;
}[] = [
  {
    type: "insert",
    title: "Insert",
    icon: <NorthWestIcon />,
  },
  {
    type: "replace",
    title: "Replace",
    icon: <PublishedWithChangesIcon />,
  },
  {
    type: "refine",
    title: "Refine",
    icon: <ReplayIcon />,
  },
];

const MessageBox = ({ messages, showShortcuts, handleClickShortcut, shortcutVisible }: MessageBoxProps) => {
  const actionRef = useRef(null);
  const [actionWidth, setActionWidth] = useState<{ [key: string]: number }>({});

  const onClickShortcut = (type: IShortcutType, message: IMessage) => {
    if (handleClickShortcut) {
      if (message.type == "text" && ["insert", "replace"].includes(type)) {
        const element = document.querySelector(`.markdown-preview-${message.id}`);
        if (element) {
          const text = element.innerHTML;
          handleClickShortcut(type, { ...message, value: text });
        } else {
          console.log("###", "Element not found");
        }
      } else {
        handleClickShortcut(type, message);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      messages.forEach((message) => {
        const element = document.getElementById(message.id);
        if (element) {
          setActionWidth((prev) => ({ ...prev, [message.id]: element.clientWidth }));
        }
      });
    }, 10);
    return () => clearInterval(interval);
  }, [messages]);

  const getActionText = (message: IMessage) => {
    if (message.createdBy === "user") {
      return "";
    }
    if (message.isRefine) {
      return "Refine";
    } else if (message.action !== "default") {
      return message.action;
    } else {
      return "";
    }
  };
  return (
    <div className="mini-messages">
      {messages.map((message, index) => {
        const actionText = getActionText(message);
        return (
          <div key={index} className={`message-bubble-small ${message.createdBy}`}>
            <Creator message={message} />
            <div className="message-body">
              {message.type === "loading" ? (
                <div className="loading-dots">
                  <span>. </span>
                  <span>. </span>
                  <span>. </span>
                </div>
              ) : message.type === "image" ? (
                <img src={message.value} alt="option" style={{ maxWidth: "100%" }} />
              ) : (
                <div style={{ position: "relative" }} className="message-body__content" data-color-mode="light">
                  {!!actionText && (
                    <Typography
                      variant="subtitle1"
                      className="message-body__content_action"
                      ref={actionRef}
                      id={message.id}
                      fontWeight="bold"
                    >
                      {actionText}
                    </Typography>
                  )}
                  <MarkdownPreview
                    source={message.value}
                    className={`message-body__content_text markdown-preview-${message.id}`}
                  />
                </div>
              )}
            </div>
            {showShortcuts && message.createdBy === "bot" && message.type !== "loading" && (
              <Grid container spacing={1} className="shortcuts">
                {shortcuts.map((shortcut, idx) => {
                  if (shortcutVisible === undefined || shortcutVisible(message, shortcut.type) !== "hidden") {
                    return (
                      <Grid item key={idx}>
                        <Button
                          onClick={() => onClickShortcut(shortcut.type, message)}
                          variant="outlined"
                          color="inherit"
                          startIcon={shortcut.icon}
                          size="small"
                          disabled={shortcutVisible && shortcutVisible(message, shortcut.type) === "disabled"}
                        >
                          {shortcut.title}
                        </Button>
                      </Grid>
                    );
                  } else {
                    return null;
                  }
                })}
              </Grid>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageBox;
