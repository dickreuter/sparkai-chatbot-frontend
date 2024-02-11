
import FileUploader from '../components/FileUploader';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import SideBar from '../routes/Sidebar.tsx' 
import { useAuthUser } from 'react-auth-kit';
import "./Bids.css";

import React, { useState, useEffect, useRef } from 'react';


const Bids = () => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    return (
      <div className="App text-center">
         
        <h1 className='fw-bold'>Bid Tracker</h1>
        <table className="bids-table">
          <thead>
            <tr>
              <th>Bid</th>
              <th>Last edited</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1) Bid 1</td>
              <td>Last edited: 07/02/2024</td>
              <td><span className="status new">New</span></td>
            </tr>
            {/* Additional dummy bids */}
            <tr>
              <td>2) Bid 2</td>
              <td>Last edited: 06/02/2024</td>
              <td><span className="status ongoing">Ongoing</span></td>
            </tr>
            <tr>
              <td>3) Bid 3</td>
              <td>Last edited: 05/02/2024</td>
              <td><span className="status complete">Complete</span></td>
            </tr>
            <tr>
              <td>4) Bid 4</td>
              <td>Last edited: 04/02/2024</td>
              <td><span className="status review">Review</span></td>
            </tr>
            <tr>
              <td>5) Bid 5</td>
              <td>Last edited: 03/02/2024</td>
              <td><span className="status hold">On Hold</span></td>
            </tr>
            {/* Continue adding more dummy bids as needed */}
          </tbody>
        </table>
      </div>
    );
  }
  
  

export default withAuth(Bids);
