import React from "react";
import { Typography } from "@mui/material";

const Welcome = () => {
  return (
    <div className="welcome">
      <img src="/assets/logo.png" alt="logo" height="48px" />{" "}
      <Typography variant="h5">Welcome to mytender.io!</Typography>
    </div>
  );
};

export default Welcome;
