import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {useAuthUser} from "react-auth-kit";
import {Button, Col, Container, Form, Row, Spinner, Card} from "react-bootstrap";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import {displayAlert} from "../helper/Alert";
import {API_URL, HTTP_PREFIX} from "../helper/Constants";
import withAuth from "../routes/withAuth";
import "./Feedback.css";
import CustomEditor from "../components/TextEditor.tsx";
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import SideBar from '../routes/Sidebar.tsx' 

const Feedback = () => {
  
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


    const submitFeedback = async () => {
        const formData = new FormData();
        formData.append("text", `Question: ${inputText} \n Feedback: ${feedback}`);
        formData.append("profile_name", dataset); // Assuming email is the profile_name
        formData.append("mode", "feedback");
        console.log(formData);

        try {
            await axios.post(`http${HTTP_PREFIX}://${API_URL}/uploadtext`, formData, {
                headers: {Authorization: `Bearer ${tokenRef.current}`},
            });
            displayAlert("Feedback upload successful", "success");
            // Handle successful submission, e.g., clear feedback or show a message
        } catch (error) {
            console.error("Error sending feedback:", error);
            // Handle error
        }
    };



    return (
        <div id="feedback-page">
            <SideBar />
            <div className="chat-container">
                <div className="feedback-container">

                    <Row className="justify-content-md-center">
                        <Col md={12}>
                            <div className="d-flex justify-content-center mb-3">
                                <CustomEditor response={response} appendResponse={appendResponse}/>
                            </div>
                           
                        </Col>
                    </Row>
                </div>

                    <Row className="justify-content-md-center text-center">
                        <Col md={12}>
                        <Form.Group className="mb-3">
                                <Form.Label>
                                    Feedback: (describe how the question can be answered better in the
                                    future){" "}
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    className="feedback-textarea"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    disabled={!questionAsked} // Disabled until a question is asked
                                />
                            </Form.Group>
                            <div className="d-flex justify-content-center mb-3">
                                <Button
                                    variant="primary"
                                    onClick={submitFeedback}
                                    className="chat-button"
                                    disabled={!questionAsked} // Disabled until a question is asked
                                >
                                    Submit Feedback
                                </Button>
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleAppendResponseToEditor}
                                className="mt-3"
                            >
                                Add question/answer to Text Editor
                                {/*down arrow */}

                            </Button>
                            <div>
                                <VerticalAlignBottomIcon/>
                            </div>
                           
                        </Col>
                    </Row>
               

            

            </div>
            
        </div>
    );
};

export default withAuth(Feedback);
