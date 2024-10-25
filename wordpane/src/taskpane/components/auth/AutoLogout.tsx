import React, { useEffect, useState } from "react";
import { useSignOut } from "react-auth-kit";
import { useNavigate } from "react-router-dom";

const AutoLogout = () => {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const [lastActivity, setLastActivity] = useState(Date.now());

  const INACTIVITY_TIMEOUT = 45 * 60 * 1000; // 45 minutes in milliseconds

  const handleActivity = () => {
    setLastActivity(Date.now());
  };

  const checkInactivity = () => {
    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
      performSignOut();
    }
  };

  const performSignOut = () => {
    signOut();
    navigate("/login");
  };

  useEffect(() => {
    // Set up event listeners for user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    // Set up interval to check for inactivity
    const interval = setInterval(checkInactivity, 60000); // Check every minute

    // Clean up event listeners and interval on component unmount
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity]);

  return null; // This component doesn't render anything
};

export default AutoLogout;
