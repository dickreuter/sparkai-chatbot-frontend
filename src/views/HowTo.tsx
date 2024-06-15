import React, {useEffect, useRef, useState} from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import {Button, Col,  Row, Card, Modal} from "react-bootstrap";
import UploadPDF from './UploadPDF';
import UploadText from './UploadText';
import "./Library.css";
import SideBarSmall from '../routes/SidebarSmall.tsx' ;
import handleGAEvent from "../utilities/handleGAEvent.tsx";
import { faEye, faTrash, faFolder, faFileAlt,  faArrowUpFromBracket, faEllipsisVertical} from '@fortawesome/free-solid-svg-icons';
import "./Chatbot.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UploadPDFModal, UploadTextModal, UploadButtonWithDropdown } from "./UploadButtonWithDropdown.tsx";


const Library = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");




return (
  <div className="chatpage">
    <SideBarSmall />

    <div className="lib-container">
      <h1 className='heavy'>How To</h1>

      <div className="library-container mt-4">
       </div>
       
    </div>
  </div>
);
}

export default withAuth(Library);
