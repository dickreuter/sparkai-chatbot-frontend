import React, { useMemo } from "react";
import { IMessage } from "../../../types";
import { Typography } from "@mui/material";

interface CreatorProps {
  message: IMessage;
}

const Creator = ({ message }: CreatorProps) => {
  const isUser = useMemo(() => message.createdBy === "user", [message.createdBy]);
  return (
    <div className="creator">
      {message.createdBy === "user" ? <img src="/assets/user.svg" /> : <img src="/assets/logo.png" />}
      <Typography variant="caption" display="block" fontWeight={isUser ? "normal" : "bold"}>
        {isUser ? "You" : "mytender.io"}
      </Typography>
    </div>
  );
};
export default Creator;
