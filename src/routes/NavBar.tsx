import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import { useEffect, useRef, useState } from "react";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import "./Navbar.css";
import handleGAEvent from "../utilities/handleGAEvent";

const NavBar = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const [email, setLoginEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const tokenRef = useRef(auth?.token || "default");
  const signOut = useSignOut();
  const navigate = useNavigate();

  const toggle = () => setIsOpen(!isOpen);



  const handleNavLinkClick = () => {
    handleGAEvent('Navigation', 'Link Click', 'newbid');
    localStorage.removeItem('bidInfo');
    localStorage.removeItem('backgroundInfo');
    localStorage.removeItem('response');
    localStorage.removeItem('inputText');
    localStorage.removeItem('bidState');
    window.location.href = `/bid-extractor`;


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
        mytender.io &nbsp;

      </a>

      <div
        className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
        id="navbarTogglerDemo03"
      >
        <ul className="navbar-nav ml-auto">
          {" "}
          {/* Apply ml-auto here */}



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
            email === "adminuser" && (
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
            )
          ) : (
            <></>
          )}
       {auth ? (
        <li className="nav-item">
  <button className="btn btn-white nav-link" onClick={() => handleNavLinkClick()}>
    New Bid
  </button>
</li>

) : <></>}


       {auth ? (
        <li className="nav-item ">
          <Link to="/login">
            <button onClick={signOut} className="btn btn-dark nav-link">
            Logout
          </button>
        </Link>
        </li>
      ) : (
        <>
          <li className="nav-item">
          <Link to="/login">
          <button className="btn btn-dark nav-link">
            Login
          </button>
        </Link>
          </li>
        </>
      )}

        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
