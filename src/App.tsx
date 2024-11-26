import React, { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider, useAuthUser } from "react-auth-kit";
import "./App.css";
import "./resources/clash-display.css";
import NavBar from "./routes/NavBar";
import Routing from "./routes/Routing";
import ReactGA4 from "react-ga4";
import "./Widget.css";
import SupportChat from "./components/SupportChat.tsx";
import AutoLogout from "./components/auth/AutoLogout.tsx";
import posthog from "posthog-js";

ReactGA4.initialize("G-X8S1ZMRM3C");

// Initialize PostHog at the app level
posthog.init("phc_bdUxtNoJmZWNnu1Ar29zUtusFQ4bvU91fZpLw5v4Y3e", {
  api_host: "https://eu.i.posthog.com",
  person_profiles: "identified_only"
});

const Layout = () => {
  const location = useLocation();
  const getAuth = useAuthUser();
  const auth = getAuth();

  useEffect(() => {
    if (auth?.token) {
      console.log("User authenticated");
      // Identify user in PostHog when authenticated
      posthog.identify(auth.email, {
        email: auth.email
      });
    }
  }, [auth?.token]);

  const isAuthenticated = auth?.token !== undefined;
  const showNavBarPaths = [
    "/library",
    "/howto",
    "/bids",
    "/proposal-planner",
    "/dashboard",
    "/chatResponse",
    "/bid-extractor",
    "/question-crafter",
    "/proposal",
    "/profile",
    "/calculator",
    "/question-answer",
    "/proposal-preview",
    "/"
  ];
  const shouldShowNavBar = showNavBarPaths.includes(location.pathname);

  return (
    <>
      {isAuthenticated && <AutoLogout />}
      {shouldShowNavBar && <NavBar />}
      <div className="main-content">
        <Routing />
      </div>
      {isAuthenticated && <SupportChat auth={auth} />}{" "}
      {/* Use the ChatBot component */}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider authType={"localstorage"} authName={"sparkaichatbot"}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
