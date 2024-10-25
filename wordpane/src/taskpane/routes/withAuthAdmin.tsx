// src/hoc/withAuth.js
import React, { useEffect, useRef } from "react";
import { useAuthUser, useIsAuthenticated } from "react-auth-kit";
import { useNavigate } from "react-router-dom";

const withAuthAdmin = (WrappedComponent) => {
  return (props) => {
    const isAuth = useIsAuthenticated();
    const navigate = useNavigate();

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    const email = auth?.email || "default";

    useEffect(() => {
      // Check if user is authenticated
      if (!isAuth() || email != "adminuser") {
        // Navigate to login if not authenticated
        navigate("/login");
      }
    }, [isAuth, navigate]); // Add dependencies to the useEffect hook

    // Render the wrapped component if authenticated,
    // or return null while waiting for useEffect to run
    return isAuth() ? <WrappedComponent {...props} /> : null;
  };
};

export default withAuthAdmin;
