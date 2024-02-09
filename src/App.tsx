import React from 'react';
import { AuthProvider } from 'react-auth-kit';
import { BrowserRouter, useLocation } from 'react-router-dom';
import './App.css';
import NavBar from './routes/NavBar';
import Routing from './routes/Routing';

const Layout = () => {
  const location = useLocation();
  
  // Check if the current location is not the Bids page
  const showNavBar = location.pathname !== '/bids'; // Adjust '/bids' to the exact path of your Bids page
  
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
