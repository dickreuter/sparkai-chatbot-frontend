import React from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import { useEffect, useRef, useState } from "react";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import "./Navbar.css";

const NavBar = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const [email, setLoginEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const tokenRef = useRef(auth?.token || "default");
  const signOut = useSignOut();
  const navigate = useNavigate();

  const toggle = () => setIsOpen(!isOpen);

  useEffect(() => {
    tokenRef.current = auth?.token || "default";
  }, [auth]);

  useEffect(() => {
    // Function to fetch email
    const fetchEmail = async () => {
      try {
        const token = tokenRef.current;
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/get_login_email`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const { email } = response.data;
        setLoginEmail(email || "default");
      } catch (error) {
        console.error("Failed to get login email:", error);
        setLoginEmail("default");
        signOut();
      }
    };

    // Fetch email immediately on mount
    fetchEmail();

    // Then set up interval to fetch email every 80 seconds
    const interval = setInterval(fetchEmail, 80000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [auth]);
  return (
    <nav className="navbar navbar-expand-sm fixed-top navbar-light bg-light">
      <a className="navbar-brand" href="/">
        mytender.io &nbsp;
      </a>

      <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="navbarTogglerDemo03">
        <ul className="navbar-nav ml-auto"></ul>
      </div>
    </nav>
  );
};

export default NavBar;
