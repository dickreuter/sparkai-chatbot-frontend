import React from "react";
import { IMessage, IShortcutType } from "../../../types";
import { Button, Grid } from "@mui/material";
import {
  NorthWest as NorthWestIcon,
  PublishedWithChanges as PublishedWithChangesIcon,
  Replay as ReplayIcon,
} from "@mui/icons-material";
import Creator from "./Creator";

import "./style.css";

interface MessageBoxProps {
  messages: IMessage[];
  showShortcuts: boolean;
  handleClickShortcut?: (type: IShortcutType, message: IMessage) => void;
  shortcutVisible?: (message: IMessage, type: IShortcutType) => boolean;
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
  return (
    <div className="mini-messages">
      {messages.map((message, index) => (
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
              <div dangerouslySetInnerHTML={{ __html: message.value }} />
            )}
          </div>
          {showShortcuts && message.createdBy === "bot" && message.type !== "loading" && (
            <Grid container spacing={1}>
              {shortcuts.map((shortcut, idx) => {
                if (shortcutVisible === undefined || shortcutVisible(message, shortcut.type)) {
                  return (
                    <Grid item key={idx}>
                      <Button
                        onClick={() => handleClickShortcut && handleClickShortcut(shortcut.type, message)}
                        variant="outlined"
                        color="inherit"
                        startIcon={shortcut.icon}
                        size="small"
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
      ))}
    </div>
  );
};

export default MessageBox;
