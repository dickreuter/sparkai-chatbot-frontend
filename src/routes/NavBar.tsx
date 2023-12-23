import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import { useEffect, useRef, useState } from "react";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { Link } from "react-router-dom";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import './Navbar.css';

const NavBar = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const [email, setLoginEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const tokenRef = useRef(auth?.token || "default");
  const signOut = useSignOut();

  const toggle = () => setIsOpen(!isOpen);
  const handleNavLinkClick = () => {
    if (window.innerWidth <= 768) {
      // Bootstrap's breakpoint for small devices
      toggle();
    }
  };

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
  }, [auth]); // Depend on auth state

  return (
    <nav className="navbar navbar-expand-sm fixed-top navbar-light bg-light">
      <button
        className="navbar-toggler"
        type="button"
        onClick={toggle}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <a className="navbar-brand" href="/">
         
         
           SPARK AI 
           &nbsp;
           <i className="far fa-comments"></i> 
      </a>

      <div
        className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
        id="navbarTogglerDemo03"
      >
        <ul className="navbar-nav ml-auto">
          {" "}
          {/* Apply ml-auto here */}
          {auth ? (
            <li className="nav-item">
              <Link className="nav-link" to="/logout">
                Logout
              </Link>
            </li>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  Login
                </Link>
              </li>
            </>
          )}
          {auth ? (
            <li className="nav-item">
              <Link className="nav-link" to="/chatbot">
                Chatbot
              </Link>
            </li>
          ) : (
            <></>
          )}
          {auth ? (
            <li className="nav-item">
              <Link className="nav-link" to="/uploadpdf">
                Upload PDFs
              </Link>
            </li>
          ) : (
            <></>
          )}
          {auth ? (
            <li className="nav-item">
              <Link className="nav-link" to="/uploadtext">
                Upload Text
              </Link>
            </li>
          ) : (
            <></>
          )}
          {auth ? (
            email === "adminuser" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/adminpannel">
                    Admin Pannel{" "}
                  </Link>
                </li>
              </>
            )
          ) : (
            <></>
          )}
          {auth ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/qlog">
                  Question Log{" "}
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/flog">
                  Feedback Log{" "}
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;