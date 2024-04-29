import React, { useRef } from 'react';
import { AuthProvider, useAuthUser } from 'react-auth-kit';
import { BrowserRouter, useLocation } from 'react-router-dom';
import './App.css';
import './resources/clash-display.css';
import NavBar from './routes/NavBar';
import Routing from './routes/Routing';
import ReactGA4 from "react-ga4";
import { useEffect } from 'react';
import { Widget, addResponseMessage } from 'react-chat-widget';
import 'react-chat-widget/lib/styles.css';
import sidebarIcon from './resources/images/mytender.io_badge.png';
import './Widget.css';
ReactGA4.initialize("G-X8S1ZMRM3C");

const Layout = () => {
  const location = useLocation();
  const getAuth = useAuthUser();
  const auth = getAuth();

  useEffect(() => {
    
    if (auth?.token) {
     
      addResponseMessage('Welcome to this awesome chat!');
    } else {
      console.log("");
    }
  }, [auth?.token]);

  const isAuthenticated = auth?.token !== undefined;
  const showNavBarPaths = ['/library', '/chatbot', '/bids', '/'];
  const shouldShowNavBar = showNavBarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavBar && <NavBar />}
      <div className="main-content">
        <Routing />
      </div>
      {isAuthenticated && (
        <Widget
          handleNewUserMessage={handleNewUserMessage}
          title="Support"
          subtitle="Ask us anything"
        />
      )}
    </>
  );
};


function handleNewUserMessage(newMessage) {
  const response = "Your response logic here";
  addResponseMessage(response);
}

const App = () => {
  useEffect(() => {

    const token = localStorage.getItem('sparkaichatbot'); // Adjust based on your actual token key
  
  }, []);

  return (
    <AuthProvider authType={"localstorage"} authName={"sparkaichatbot"}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;