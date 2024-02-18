import React from 'react';
import { AuthProvider } from 'react-auth-kit';
import { BrowserRouter, useLocation } from 'react-router-dom';
import './App.css';
import NavBar from './routes/NavBar';
import Routing from './routes/Routing';

const Layout = () => {
  const location = useLocation();
  
  // List of paths where the NavBar should be hidden
  const hideNavBarPaths = [ '/chatbot', '/proposal', '/'];
  
  // Check if the current location's pathname is NOT in the list of paths
  const showNavBar = !hideNavBarPaths.includes(location.pathname);
  
  return (
    <>
      {showNavBar && <NavBar />}
      <div className="main-content">
        <Routing />
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider authType={"localstorage"} authName={"sparkaichatbot"}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
