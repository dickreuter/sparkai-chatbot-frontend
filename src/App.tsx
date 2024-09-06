import React, {useEffect} from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider, useAuthUser } from 'react-auth-kit';
import './App.css';
import './resources/clash-display.css';
import NavBar from './routes/NavBar';
import Routing from './routes/Routing';
import ReactGA4 from "react-ga4";
import sidebarIcon from './resources/images/mytender.io_badge.png';
import './Widget.css';
import SupportChat from "./components/SupportChat.tsx";

ReactGA4.initialize("G-X8S1ZMRM3C");

const Layout = () => {
  const location = useLocation();
  const getAuth = useAuthUser();
  const auth = getAuth();

  useEffect(() => {
    if (auth?.token) {
      console.log("User authenticated");
    }
  }, [auth?.token]);

  const isAuthenticated = auth?.token !== undefined;
  const showNavBarPaths = ['/library', '/howto', '/bids', '/', '/dashboard', '/chatResponse', "/bid-extractor", "/question-crafter", "/proposal", "/profile", "/calculator"  ];
  const shouldShowNavBar = showNavBarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavBar && <NavBar />}
      <div className="main-content">
        <Routing />
      </div>
      {isAuthenticated && <SupportChat auth={auth} />} {/* Use the ChatBot component */}
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
}


export default App;
