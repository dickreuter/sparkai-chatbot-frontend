import React, { useState, useEffect } from "react";
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import './Profile.css';
import Spinner from 'react-bootstrap/Spinner'; // Ensure you have react-bootstrap installed

const ProfilePage = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  
  

  return (
    <div className="chatpage">
      <SideBarSmall />

      <div className="lib-container">
        <h1 className='heavy'>Profile</h1>

    
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
