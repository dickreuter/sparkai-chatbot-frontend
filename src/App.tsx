import React from 'react';
import { AuthProvider } from 'react-auth-kit';
import { BrowserRouter, useLocation } from 'react-router-dom';
import './App.css';
import NavBar from './routes/NavBar';
import Routing from './routes/Routing';

const Layout = () => {
  const location = useLocation();
  
  // List of paths where the NavBar should be hidden
  const showNavBarPaths = ['/library', '/chatbot', '/bids', '/']; // Added '/login' to the array
 
  // Check if the current path is in the list of paths to hide the NavBar
  const shouldShowNavBar = showNavBarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavBar && <NavBar />}
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
