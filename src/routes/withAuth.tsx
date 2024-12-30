// src/hoc/withAuth.js
import { ComponentType, useEffect } from "react";
import { useIsAuthenticated } from "react-auth-kit";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent: ComponentType) => {
  return (props: any) => {
    const isAuth = useIsAuthenticated();
    const navigate = useNavigate();

    useEffect(() => {
      // Check if user is authenticated
      if (!isAuth()) {
        // Navigate to login if not authenticated
        navigate("/login");
      }
    }, [isAuth, navigate]); // Add dependencies to the useEffect hook

    // Render the wrapped component if authenticated,
    // or return null while waiting for useEffect to run
    return isAuth() ? <WrappedComponent {...props} /> : null;
  };
};

export default withAuth;
