import React from "react";
import { IMessage } from "../../../types";
import { PermIdentityRounded as PermIdentityRoundedIcon } from "@mui/icons-material";
import { Typography } from "@mui/material";

interface CreatorProps {
  message: IMessage;
}

const Creator = ({ message }: CreatorProps) => {
  return (
    <div className="creator">
      {message.createdBy === "user" ? <PermIdentityRoundedIcon /> : <img src="/assets/logo.png" />}
      <Typography variant="caption" display="block" fontWeight="bold">
        {message.createdBy === "user" ? "You" : "mytender.io"}
      </Typography>
    </div>
  );
};
export default Creator;
