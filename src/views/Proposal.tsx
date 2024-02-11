import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {useAuthUser} from "react-auth-kit";
import {Button, Col, Container, Form, Row, Spinner, Card} from "react-bootstrap";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import withAuth from "../routes/withAuth";
import CustomEditor from "../components/TextEditor.tsx";
import SideBar from '../routes/Sidebar.tsx' ;
import "./Propsal.css";

const Proposal = () => {
  
    const [dataset, setDataset] = useState("default");
    const [inputText, setInputText] = useState("");
    const [response, setResponse] = useState("");
  
    const [feedback, setFeedback] = useState("");
    const [questionAsked, setQuestionAsked] = useState(false);
  
    const [appendResponse, setAppendResponse] = useState(false);

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    const handleAppendResponseToEditor = () => {
        setAppendResponse({question: inputText, answer: response}); // Include both question and answer
    };



    return (
        <div id="proposal-page">
            <SideBar />
            
            <div className="chat-container">
                <h3 className="text-center mb-2 fw-bold">Text Editor</h3>
                <div className="proposal-container">
                        <Row className="justify-content-md-center">
                            <Col md={12}>
                                <div className="d-flex justify-content-center mb-3">
                                    <CustomEditor response={response} appendResponse={appendResponse}/>
                                </div>
                            
                            </Col>
                        </Row>
                </div>
                    
                    
               

            </div>
            
        </div>
    );
};

export default withAuth(Proposal);